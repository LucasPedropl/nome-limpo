using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

public record AlterarWhatsAppRequest(bool Ativo);
public record TestarWhatsAppRequest(string Telefone);

/// <summary>
/// Liga/desliga e conexão do WhatsApp da empresa (instância da Bixs). Só backoffice.
/// </summary>
[ApiController]
[Route("api/whatsapp")]
[Authorize(Policy = AuthPolicies.Backoffice)]
public class WhatsAppController : ControllerBase
{
    private readonly WhatsAppService _whatsApp;

    public WhatsAppController(WhatsAppService whatsApp)
    {
        _whatsApp = whatsApp;
    }

    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        return Ok(await _whatsApp.GetStatusAsync());
    }

    /// <summary>Liga ou desliga todos os envios automáticos por WhatsApp. Vale na hora.</summary>
    [HttpPut("ativo")]
    public async Task<IActionResult> AlterarAtivo([FromBody] AlterarWhatsAppRequest req)
    {
        var usuario = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? User.FindFirst(ClaimTypes.Name)?.Value;
        await _whatsApp.SetAtivoAsync(req.Ativo, usuario);
        return Ok(await _whatsApp.GetStatusAsync());
    }

    /// <summary>QR Code para conectar o WhatsApp da empresa (ou conectado = true se já estiver).</summary>
    [HttpPost("conectar")]
    public async Task<IActionResult> Conectar()
    {
        try
        {
            var conexao = await _whatsApp.ConectarAsync();
            return Ok(new { instanciaId = conexao.InstanciaId, conectado = conexao.Conectado, qrCode = conexao.QrCode });
        }
        catch (Exception ex) when (ex is BixsException or InvalidOperationException or HttpRequestException)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Mensagem de teste. Respeita a chave: desligado não envia.</summary>
    [HttpPost("teste")]
    public async Task<IActionResult> Testar([FromBody] TestarWhatsAppRequest req)
    {
        if (WhatsAppService.NumeroWhatsApp(req.Telefone) is null)
            return BadRequest(new { message = "Telefone inválido. Use DDD + número (ex.: 31999998888)." });

        var envio = await _whatsApp.EnviarAsync(
            req.Telefone,
            "Teste",
            "*Nome Limpo Express*\n\nMensagem de teste do backoffice: o WhatsApp está funcionando.",
            automatico: false);

        return envio.Enviado
            ? Ok(new { enviado = true, message = "Mensagem de teste enviada." })
            : BadRequest(new { enviado = false, message = envio.Erro });
    }
}
