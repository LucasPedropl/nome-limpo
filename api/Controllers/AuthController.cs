using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Dtos;
using NomeLimpo.Api.Models;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordService _hasher;
    private readonly TokenService _tokenService;
    private readonly OtpService _otp;
    private readonly IEmailService _emailService;
    private readonly IWebHostEnvironment _env;
    private readonly WhatsAppService _whatsApp;

    public AuthController(
        AppDbContext db,
        PasswordService hasher,
        TokenService tokenService,
        OtpService otp,
        IEmailService emailService,
        IWebHostEnvironment env,
        WhatsAppService whatsApp)
    {
        _db = db;
        _hasher = hasher;
        _tokenService = tokenService;
        _otp = otp;
        _emailService = emailService;
        _env = env;
        _whatsApp = whatsApp;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Senha))
            return BadRequest(new { message = "E-mail e senha são obrigatórios." });

        var usuario = await _db.UsuariosAdmin.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower().Trim());
        if (usuario == null || !usuario.Ativo)
            return Unauthorized(new { message = "Credenciais inválidas ou usuário inativo." });

        if (!_hasher.Verify(usuario.SenhaHash, req.Senha))
            return Unauthorized(new { message = "Credenciais inválidas." });

        var token = _tokenService.GenerateToken(usuario);
        return Ok(new LoginResponse(token, usuario.Nome, usuario.Email, usuario.Perfil));
    }

    /// <summary>
    /// 1ª etapa do login do assinante: localiza o cadastro por CPF/CNPJ, e-mail ou protocolo e envia
    /// um código de 6 dígitos para o e-mail cadastrado (e para o WhatsApp do cadastro, se o WhatsApp estiver ligado).
    /// A resposta é a mesma exista ou não o cadastro.
    /// </summary>
    [HttpPost("cliente-login/solicitar-codigo")]
    [AllowAnonymous]
    public async Task<IActionResult> SolicitarCodigoClienteLogin([FromBody] ClienteLoginRequest req)
    {
        var cleanTerm = ClienteLoginTerm(req);
        if (string.IsNullOrWhiteSpace(cleanTerm))
            return BadRequest(new { message = "Informe CPF/CNPJ, e-mail ou número do protocolo para login." });

        // Checado antes de procurar o cadastro, para a resposta não revelar se ele existe
        var whatsAppAtivo = await _whatsApp.IsAtivoAsync();
        if (!_emailService.IsConfigured && !whatsAppAtivo && !_env.IsDevelopment())
            return StatusCode(503, new { message = "O envio do código está indisponível no momento. Tente novamente mais tarde." });

        var cliente = await FindClienteAsync(cleanTerm);
        string? simulatedCode = null;
        if (cliente is not null)
        {
            var (code, _, isNew) = _otp.Issue("login:" + cliente.Id);
            if (isNew)
            {
                if (_emailService.IsConfigured || _env.IsDevelopment())
                    await _emailService.SendOtpEmailAsync(cliente.Email, code);
                if (whatsAppAtivo)
                    await _whatsApp.EnviarAsync(cliente.Telefone, cliente.NomeRazaoSocial, WhatsAppService.MensagemCodigo(code));
            }
            simulatedCode = _env.IsDevelopment() ? code : null; // Exposto apenas em Development
        }

        return Ok(new
        {
            success = true,
            message = whatsAppAtivo
                ? "Se houver uma assinatura com esses dados, enviamos um código de 6 dígitos para o e-mail e o WhatsApp cadastrados."
                : "Se houver uma assinatura com esses dados, enviamos um código de 6 dígitos para o e-mail cadastrado.",
            simulatedCode
        });
    }

    /// <summary>
    /// 2ª etapa do login do assinante: mesmos dados da 1ª etapa + código recebido no e-mail cadastrado.
    /// </summary>
    [HttpPost("cliente-login")]
    [AllowAnonymous]
    public async Task<IActionResult> ClienteLogin([FromBody] ClienteLoginRequest req)
    {
        var cleanTerm = ClienteLoginTerm(req);
        var codigo = (req.Codigo ?? "").Trim().Replace(" ", "");
        if (string.IsNullOrWhiteSpace(cleanTerm) || string.IsNullOrEmpty(codigo))
            return BadRequest(new { message = "Informe seus dados e o código enviado para o e-mail cadastrado." });

        var cliente = await FindClienteAsync(cleanTerm);
        var result = cliente is null ? OtpValidationResult.Invalid : _otp.Validate("login:" + cliente.Id, codigo);
        if (cliente is null || result != OtpValidationResult.Valid)
        {
            return Unauthorized(new
            {
                message = result == OtpValidationResult.Expired
                    ? "Código expirado. Solicite um novo."
                    : "Código inválido ou expirado. Confira o e-mail ou o WhatsApp cadastrado, ou solicite um novo código."
            });
        }

        var processo = cliente.Processos.OrderByDescending(p => p.CreatedAt).FirstOrDefault();
        var protocolo = processo?.Protocolo;
        var token = _tokenService.GenerateClientToken(cliente, protocolo);

        return Ok(new
        {
            success = true,
            token,
            cliente = new
            {
                id = cliente.Id,
                nomeRazaoSocial = cliente.NomeRazaoSocial,
                cpfCnpj = cliente.CpfCnpj,
                email = cliente.Email,
                telefone = cliente.Telefone,
                tipoPessoa = cliente.TipoPessoa,
                status = cliente.Status
            },
            protocolo,
            processo = processo is not null ? new
            {
                id = processo.Id,
                protocolo = processo.Protocolo,
                status = processo.Status,
                birosNotificados = processo.BirosNotificados,
                dataInicio = processo.DataInicio.ToString("dd/MM/yyyy"),
                dataPrevistaConclusao = processo.DataPrevistaConclusao.ToString("dd/MM/yyyy"),
                garantiaValida = processo.GarantiaValida
            } : null
        });
    }

    private static string ClienteLoginTerm(ClienteLoginRequest req) =>
        (req.CpfCnpj ?? req.Email ?? req.Protocolo ?? "").Trim();

    private Task<Cliente?> FindClienteAsync(string cleanTerm)
    {
        var digitsOnly = System.Text.RegularExpressions.Regex.Replace(cleanTerm, @"\D", "");
        var cleanLower = cleanTerm.ToLowerInvariant();

        return _db.Clientes
            .Include(c => c.Processos)
            .FirstOrDefaultAsync(c =>
                c.CpfCnpj == cleanTerm ||
                (!string.IsNullOrEmpty(digitsOnly) && c.CpfCnpj.Replace(".", "").Replace("-", "").Replace("/", "") == digitsOnly) ||
                c.Email.ToLower() == cleanLower ||
                c.Processos.Any(p => p.Protocolo == cleanTerm));
    }

    /// <summary>
    /// Valida o token JWT atual e retorna os dados do usuário autenticado.
    /// </summary>
    [HttpGet("me")]
    [Authorize] // Admin ou cliente
    public async Task<IActionResult> GetCurrentUser()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(sub))
        {
            return Unauthorized(new { message = "Token não fornecido ou inválido." });
        }

        // Verifica se é admin
        var admin = await _db.UsuariosAdmin.FirstOrDefaultAsync(u => u.Id == sub);
        if (admin is not null)
        {
            return Ok(new { role = "Admin", user = admin });
        }

        // Verifica se é cliente
        var cliente = await _db.Clientes
            .Include(c => c.Processos)
            .FirstOrDefaultAsync(c => c.Id == sub);

        if (cliente is not null)
        {
            var processo = cliente.Processos.OrderByDescending(p => p.CreatedAt).FirstOrDefault();
            return Ok(new
            {
                role = "Cliente",
                cliente = new
                {
                    id = cliente.Id,
                    nomeRazaoSocial = cliente.NomeRazaoSocial,
                    cpfCnpj = cliente.CpfCnpj,
                    email = cliente.Email,
                    telefone = cliente.Telefone,
                    status = cliente.Status
                },
                protocolo = processo?.Protocolo
            });
        }

        return NotFound(new { message = "Usuário não localizado." });
    }
}
