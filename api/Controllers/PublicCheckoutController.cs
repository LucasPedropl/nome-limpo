using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Models;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

public record SolicitarOtpRequest(string? CpfCnpj, string Email);
public record ValidarOtpRequest(string? CpfCnpj, string Email, string Codigo);
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
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly OtpService _otp;
    private readonly IWebHostEnvironment _env;
    private readonly TokenService _tokenService;

    public CheckoutController(
        AppDbContext db,
        IEmailService emailService,
        OtpService otp,
        IWebHostEnvironment env,
        TokenService tokenService)
    {
        _db = db;
        _emailService = emailService;
        _otp = otp;
        _env = env;
        _tokenService = tokenService;
    }

    /// <summary>
    /// 1ª etapa do checkout: envia o código de 6 dígitos. CPF/CNPJ já cadastrado recebe no e-mail que está no cadastro,
    /// nunca no e-mail digitado — é assim que o titular prova que é ele antes de gerar cobrança no nome dele.
    /// </summary>
    [HttpPost("solicitar-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> SolicitarOtp([FromBody] SolicitarOtpRequest req)
    {
        var doc = Regex.Replace(req.CpfCnpj ?? "", @"\D", "");
        if (string.IsNullOrWhiteSpace(req.Email) || (doc.Length != 11 && doc.Length != 14))
            return BadRequest(new { message = "CPF/CNPJ e e-mail são obrigatórios." });

        // Sem SMTP o código não chega a ninguém: melhor avisar do que dizer que foi enviado
        if (!_emailService.IsConfigured && !_env.IsDevelopment())
            return StatusCode(503, new { message = "O envio de e-mail está indisponível no momento. Tente novamente mais tarde." });

        var (destino, cadastroExistente) = await ResolverEmailDestinoAsync(doc, req.Email);
        var (code, expiresAt, isNew) = _otp.Issue(CheckoutOtpKey(doc, destino));

        // Dispara e-mail real / log (dentro do intervalo de reenvio não manda outro)
        if (isNew)
            await _emailService.SendOtpEmailAsync(destino, code);

        var emailExibido = cadastroExistente ? MascararEmail(destino) : destino;
        return Ok(new
        {
            success = true,
            message = cadastroExistente
                ? $"Este CPF/CNPJ já tem cadastro: enviamos o código de 6 dígitos para o e-mail cadastrado ({emailExibido})."
                : $"Código de validação de 6 dígitos enviado para {emailExibido}.",
            emailDestino = emailExibido,
            cadastroExistente,
            expiresAt,
            simulatedCode = _env.IsDevelopment() ? code : null // Exposto apenas em Development
        });
    }

    /// <summary>
    /// 2ª etapa do checkout: confere o código e devolve o comprovante (verificationToken, 30 min) exigido pelo
    /// POST /api/public/pagamentos/iniciar, amarrado a este CPF/CNPJ e ao e-mail que recebeu o código.
    /// </summary>
    [HttpPost("validar-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidarOtp([FromBody] ValidarOtpRequest req)
    {
        var doc = Regex.Replace(req.CpfCnpj ?? "", @"\D", "");
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Codigo) || (doc.Length != 11 && doc.Length != 14))
            return BadRequest(new { valid = false, message = "CPF/CNPJ, e-mail e código são obrigatórios." });

        var (destino, _) = await ResolverEmailDestinoAsync(doc, req.Email);
        var code = req.Codigo.Trim().Replace(" ", "");

        // Código mestre aceito apenas em Development
        var result = _env.IsDevelopment() && code == "123456"
            ? OtpValidationResult.Valid
            : _otp.Validate(CheckoutOtpKey(doc, destino), code);

        if (result == OtpValidationResult.Expired)
            return BadRequest(new { valid = false, message = "Código expirado. Solicite um novo." });
        if (result != OtpValidationResult.Valid)
            return BadRequest(new { valid = false, message = "Código inválido ou não encontrado." });

        return Ok(new
        {
            valid = true,
            message = "Código validado com sucesso!",
            verificationToken = _tokenService.GenerateCheckoutVerificationToken(doc, destino)
        });
    }

    private static string CheckoutOtpKey(string doc, string email) => $"checkout:{doc}:{email}";

    private async Task<(string Email, bool CadastroExistente)> ResolverEmailDestinoAsync(string doc, string emailDigitado)
    {
        var emailCadastrado = await _db.Clientes
            .Where(c => c.CpfCnpj.Replace(".", "").Replace("-", "").Replace("/", "") == doc)
            .Select(c => c.Email)
            .FirstOrDefaultAsync();

        return string.IsNullOrWhiteSpace(emailCadastrado)
            ? (emailDigitado.Trim().ToLowerInvariant(), false)
            : (emailCadastrado.Trim().ToLowerInvariant(), true);
    }

    private static string MascararEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 0)
            return "***";
        var visivel = email[..Math.Min(2, at)];
        return $"{visivel}***{email[at..]}";
    }

    /// <summary>
    /// Conclui o checkout da landing: não cria nada, apenas devolve o contrato de uma cobrança já confirmada
    /// (marcada como Pago pelo webhook Bixs verificado ou pelo polling de status que consulta a Bixs).
    /// Idempotente: chamadas repetidas devolvem o mesmo contrato.
    /// </summary>
    [HttpPost("concluir")]
    [AllowAnonymous]
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

    /// <summary>
    /// Processo do assinante logado (token emitido pelo login com código enviado ao e-mail cadastrado).
    /// Substitui a consulta anônima por CPF/protocolo, que expunha o processo de qualquer pessoa.
    /// </summary>
    [HttpGet("meu-processo")]
    [Authorize]
    public async Task<IActionResult> MeuProcesso()
    {
        var clienteId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(clienteId) || !User.IsInRole("Cliente"))
            return Unauthorized(new { message = "Entre na Área do Cliente para consultar seu processo." });

        var processo = await _db.Processos
            .Include(p => p.Cliente)
            .Include(p => p.Historico.OrderByDescending(h => h.Data))
            .Where(p => p.ClienteId == clienteId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

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
