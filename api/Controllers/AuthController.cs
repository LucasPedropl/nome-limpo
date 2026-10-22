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
}
