using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Services;

public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    private string GetJwtKey()
    {
        var secret = _config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException("Configuração 'Jwt:Key' ausente. Defina via dotnet user-secrets (dev) ou variável de ambiente Jwt__Key.");
        }

        return secret;
    }

    private const string CheckoutAudience = "NomeLimpoCheckoutEmail";
    private static readonly TimeSpan CheckoutVerificationLifetime = TimeSpan.FromMinutes(30);

    /// <summary>
    /// Audiências aceitas como sessão (admin e cliente). O comprovante do checkout fica fora para não autenticar nada.
    /// </summary>
    public static string[] SessionAudiences(IConfiguration config) =>
        new[] { config["Jwt:Audience"], "NomeLimpoBackoffice", "NomeLimpoEcosystem" }
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(a => a!)
            .Distinct()
            .ToArray();

    /// <summary>
    /// Comprovante de que o e-mail foi confirmado por código para aquele CPF/CNPJ. Exigido pelo iniciar do checkout.
    /// </summary>
    public string GenerateCheckoutVerificationToken(string documentoDigits, string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "NomeLimpo",
            audience: CheckoutAudience,
            claims: new[]
            {
                new Claim("doc", documentoDigits),
                new Claim("email", email)
            },
            expires: DateTime.UtcNow.Add(CheckoutVerificationLifetime),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Devolve (documento, e-mail) do comprovante, ou null se inválido/expirado.
    /// </summary>
    public (string Documento, string Email)? ValidateCheckoutVerificationToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey())),
                ValidateIssuer = false,
                ValidateAudience = true,
                ValidAudience = CheckoutAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(10)
            }, out _);

            var doc = principal.FindFirst("doc")?.Value;
            var email = principal.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(doc) || string.IsNullOrEmpty(email))
                return null;
            return (doc, email);
        }
        catch (Exception ex) when (ex is SecurityTokenException or ArgumentException)
        {
            return null;
        }
    }

    public string GenerateToken(UsuarioAdmin usuario)
    {
        var secret = GetJwtKey();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Role, usuario.Perfil)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "NomeLimpo",
            audience: _config["Jwt:Audience"] ?? "NomeLimpoBackoffice",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateClientToken(Cliente cliente, string? protocolo = null)
    {
        var secret = GetJwtKey();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, cliente.Id),
            new(JwtRegisteredClaimNames.Email, cliente.Email),
            new(ClaimTypes.Name, cliente.NomeRazaoSocial),
            new("cpf_cnpj", cliente.CpfCnpj),
            new("tipo_pessoa", cliente.TipoPessoa),
            new(ClaimTypes.Role, "Cliente")
        };

        if (!string.IsNullOrEmpty(protocolo))
        {
            claims.Add(new Claim("protocolo", protocolo));
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "NomeLimpo",
            audience: _config["Jwt:Audience"] ?? "NomeLimpoEcosystem",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30), // Sessão duradoura para o assinante
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
