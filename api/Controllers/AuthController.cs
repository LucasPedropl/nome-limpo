using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Dtos;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordService _hasher;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext db, PasswordService hasher, TokenService tokenService)
    {
        _db = db;
        _hasher = hasher;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
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
    /// Login do assinante/cliente via CPF/CNPJ, E-mail ou Protocolo.
    /// </summary>
    [HttpPost("cliente-login")]
    public async Task<IActionResult> ClienteLogin([FromBody] ClienteLoginRequest req)
    {
        var cleanTerm = (req.CpfCnpj ?? req.Email ?? req.Protocolo ?? "").Trim();
        if (string.IsNullOrWhiteSpace(cleanTerm))
            return BadRequest(new { message = "Informe CPF/CNPJ, e-mail ou número do protocolo para login." });

        var digitsOnly = System.Text.RegularExpressions.Regex.Replace(cleanTerm, @"\D", "");
        var cleanLower = cleanTerm.ToLowerInvariant();

        var cliente = await _db.Clientes
            .Include(c => c.Processos)
            .Include(c => c.Assinaturas)
                .ThenInclude(a => a.Cobrancas)
            .FirstOrDefaultAsync(c =>
                c.CpfCnpj == cleanTerm ||
                (!string.IsNullOrEmpty(digitsOnly) && c.CpfCnpj.Replace(".", "").Replace("-", "").Replace("/", "") == digitsOnly) ||
                c.Email.ToLower() == cleanLower ||
                c.Processos.Any(p => p.Protocolo == cleanTerm));

        if (cliente is null)
        {
            return NotFound(new { message = "Nenhum cadastro de assinante localizado para os dados informados." });
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

    /// <summary>
    /// Valida o token JWT atual e retorna os dados do usuário autenticado.
    /// </summary>
    [HttpGet("me")]
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
