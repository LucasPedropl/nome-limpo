using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Models;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

public record SolicitarOtpRequest(string Email);
public record ValidarOtpRequest(string Email, string Codigo);
// Os dados cadastrais vêm da cobrança já paga; do request só valem o identificador do pagamento e o CPF/CNPJ do titular
public record ConcluirCheckoutRequest(
    string? CpfCnpj,
    string? TxId,
    string? PaymentId
);

[ApiController]
[Route("api/public/[controller]")]
public class CheckoutController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, (string Code, DateTime ExpiresAt)> OtpStore = new();
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IWebHostEnvironment _env;

    public CheckoutController(
        AppDbContext db,
        IEmailService emailService,
        IWebHostEnvironment env)
    {
        _db = db;
        _emailService = emailService;
        _env = env;
    }

    [HttpPost("solicitar-otp")]
    public async Task<IActionResult> SolicitarOtp([FromBody] SolicitarOtpRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "E-mail é obrigatório." });

        var email = req.Email.Trim().ToLower();
        var code = new Random().Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(10);

        OtpStore[email] = (code, expiresAt);

        // Dispara e-mail real / log
        await _emailService.SendOtpEmailAsync(email, code);

        return Ok(new
        {
            success = true,
            message = $"Código de validação de 6 dígitos enviado para {email}.",
            expiresAt,
            simulatedCode = _env.IsDevelopment() ? code : null // Exposto apenas em Development
        });
    }

    [HttpPost("validar-otp")]
    public IActionResult ValidarOtp([FromBody] ValidarOtpRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Codigo))
            return BadRequest(new { valid = false, message = "E-mail e código são obrigatórios." });

        var email = req.Email.Trim().ToLower();
        var code = req.Codigo.Trim().Replace(" ", "");

        // Código mestre aceito apenas em Development
        if (_env.IsDevelopment() && code == "123456")
        {
            return Ok(new { valid = true, message = "Código validado com sucesso!" });
        }

        if (OtpStore.TryGetValue(email, out var stored))
        {
            if (DateTime.UtcNow > stored.ExpiresAt)
            {
                OtpStore.TryRemove(email, out _);
                return BadRequest(new { valid = false, message = "Código expirado. Solicite um novo." });
            }

            if (stored.Code == code)
            {
                OtpStore.TryRemove(email, out _);
                return Ok(new { valid = true, message = "Código validado com sucesso!" });
            }
        }

        return BadRequest(new { valid = false, message = "Código inválido ou não encontrado." });
    }

    /// <summary>
    /// Conclui o checkout da landing: não cria nada, apenas devolve o contrato de uma cobrança já confirmada
    /// (marcada como Pago pelo webhook Bixs verificado ou pelo polling de status que consulta a Bixs).
    /// Idempotente: chamadas repetidas devolvem o mesmo contrato.
    /// </summary>
    [HttpPost("concluir")]
    public async Task<IActionResult> Concluir([FromBody] ConcluirCheckoutRequest req)
    {
        var key = !string.IsNullOrWhiteSpace(req.PaymentId) ? req.PaymentId.Trim() : req.TxId?.Trim();
        if (string.IsNullOrEmpty(key) || string.IsNullOrWhiteSpace(req.CpfCnpj))
            return BadRequest(new { message = "Pagamento e CPF/CNPJ são obrigatórios para concluir a assinatura." });

        var cobranca = await _db.Cobrancas
            .FirstOrDefaultAsync(c => c.Id == key || c.TxId == key || c.ExternalCode == key);

        var cliente = cobranca is null
            ? null
            : await _db.Clientes
                .Include(c => c.Processos)
                .FirstOrDefaultAsync(c => c.Id == cobranca.ClienteId);

        // Documento precisa bater com o titular da cobrança (mesma resposta para "não existe" e "não é seu")
        var docInformado = Regex.Replace(req.CpfCnpj, @"\D", "");
        if (cobranca is null || cliente is null || Regex.Replace(cliente.CpfCnpj, @"\D", "") != docInformado)
            return NotFound(new { message = "Pagamento não localizado." });

        if (cobranca.Status != "Pago")
            return Conflict(new { message = "Pagamento ainda não confirmado." });

        var processo = cliente.Processos.OrderBy(p => p.CreatedAt).FirstOrDefault();
        if (processo is null)
            return Conflict(new { message = "Pagamento confirmado, processo ainda em criação. Tente novamente em instantes." });

        return Ok(new
        {
            success = true,
            protocolNumber = processo.Protocolo,
            contractDate = processo.DataInicio.ToString("dd/MM/yyyy"),
            estimatedCompletionDate = processo.DataPrevistaConclusao.ToString("dd/MM/yyyy"),
            customerName = cliente.NomeRazaoSocial,
            document = cliente.CpfCnpj,
            email = cliente.Email,
            phone = cliente.Telefone,
            planName = "Plano Nome Limpo Mensal Recorrente",
            planAmountFormatted = "R$ 100,00/mês",
            warrantyTerms = "Garantia contratual de 45 dias úteis ou restituição de 100% dos valores pagos, caso os apontamentos não deixem de ser exibidos em consultas externas nos órgãos de proteção ao crédito.",
            status = "ATIVO"
        });
    }

    [HttpGet("consulta/{termo}")]
    public async Task<IActionResult> ConsultarProcessoPublico(string termo)
    {
        if (string.IsNullOrWhiteSpace(termo))
            return BadRequest(new { message = "Informe o protocolo ou CPF/CNPJ." });

        var clean = termo.Trim();

        var processo = await _db.Processos
            .Include(p => p.Cliente)
            .Include(p => p.Historico.OrderByDescending(h => h.Data))
            .FirstOrDefaultAsync(p => p.Protocolo == clean || (p.Cliente != null && p.Cliente.CpfCnpj == clean));

        if (processo == null)
            return NotFound(new { message = "Nenhum processo localizado com os dados informados." });

        return Ok(new
        {
            protocolo = processo.Protocolo,
            nomeCliente = processo.Cliente?.NomeRazaoSocial,
            cpfCnpj = processo.Cliente?.CpfCnpj,
            status = processo.Status,
            birosNotificados = processo.BirosNotificados,
            dataInicio = processo.DataInicio.ToString("dd/MM/yyyy"),
            dataPrevistaConclusao = processo.DataPrevistaConclusao.ToString("dd/MM/yyyy"),
            dataConclusao = processo.DataConclusao?.ToString("dd/MM/yyyy"),
            garantiaValida = processo.GarantiaValida,
            historico = processo.Historico.Select(h => new
            {
                titulo = h.Titulo,
                descricao = h.Descricao,
                data = h.Data.ToString("dd/MM/yyyy HH:mm"),
                autor = h.Autor
            })
        });
    }
}
