using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Models;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

public record PixWebhookPayload(
    string TxId,
    string Status, // "PAID", "Liquidado", "SETTLED"
    decimal? Valor,
    string? EndToEndId
);

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<WebhooksController> _logger;
    private readonly IWebHostEnvironment _env;

    public WebhooksController(AppDbContext db, IEmailService emailService, ILogger<WebhooksController> logger, IWebHostEnvironment env)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
        _env = env;
    }

    // Webhooks legados, anônimos e sem verificação: só existem em Development.
    // Em produção a confirmação vem de POST /api/public/pagamentos/webhook (reconsulta a Bixs) ou do polling de status.
    [HttpPost("cora")]
    [HttpPost("pagweb")]
    [HttpPost("pix-confirmacao")]
    public async Task<IActionResult> ReceberWebhookPix([FromBody] PixWebhookPayload payload)
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        _logger.LogInformation("Webhook de pagamento recebido para TxID {TxId}: Status {Status}", payload.TxId, payload.Status);

        if (string.IsNullOrWhiteSpace(payload.TxId))
            return BadRequest(new { message = "TxId é obrigatório no payload do webhook." });

        var isPago = payload.Status.Equals("PAID", StringComparison.OrdinalIgnoreCase) ||
                     payload.Status.Equals("Liquidado", StringComparison.OrdinalIgnoreCase) ||
                     payload.Status.Equals("SETTLED", StringComparison.OrdinalIgnoreCase);

        if (!isPago)
        {
            return Ok(new { message = "Notificação recebida com status não liquidado ignorada." });
        }

        var cobranca = await _db.Cobrancas
            .Include(c => c.Assinatura)
                .ThenInclude(a => a!.Cliente)
                    .ThenInclude(cli => cli!.Processos)
            .FirstOrDefaultAsync(c => c.TxId == payload.TxId);

        if (cobranca == null)
        {
            _logger.LogWarning("TxId {TxId} não localizado na base de cobranças.", payload.TxId);
            return NotFound(new { message = "Cobrança não localizada." });
        }

        if (cobranca.Status != "Pago")
        {
            cobranca.Status = "Pago";
            cobranca.DataPagamento = DateTime.UtcNow;

            if (cobranca.Assinatura != null)
            {
                cobranca.Assinatura.Status = "Ativa";
                cobranca.Assinatura.ProximoVencimento = DateTime.UtcNow.AddMonths(1);

                if (cobranca.Assinatura.Cliente != null)
                {
                    var cli = cobranca.Assinatura.Cliente;
                    cli.Status = "Ativo";

                    // Dispara e-mail de recibo
                    var proc = cli.Processos.FirstOrDefault()?.Protocolo ?? "NL-GERAL";
                    await _emailService.SendPaymentReceiptEmailAsync(cli.Email, cli.NomeRazaoSocial, proc, cobranca.Valor, cobranca.TxId);

                    _db.LogsComunicacao.Add(new LogComunicacao
                    {
                        Id = "log_" + Guid.NewGuid().ToString("N")[..12],
                        ClienteId = cli.Id,
                        Tipo = "ConfirmacaoPagamento",
                        Canal = "Email",
                        Destinatario = cli.Email,
                        Assunto = $"Pagamento Confirmado — Mensalidade R$ {cobranca.Valor:N2}",
                        Conteudo = $"Confirmamos a compensação bancária do PIX de R$ {cobranca.Valor:N2} via webhook automático.",
                        Status = "Enviado",
                        DataEnvio = DateTime.UtcNow
                    });
                }
            }

            await _db.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Pagamento processado com sucesso via webhook." });
    }
}
