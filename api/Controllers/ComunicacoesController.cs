using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Services;
using NomeLimpo.Api.Dtos;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthPolicies.Backoffice)]
public class ComunicacoesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ComunicacoesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? tipo, [FromQuery] string? canal)
    {
        var query = _db.LogsComunicacao
            .Include(l => l.Cliente)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(tipo) && tipo != "Todos")
        {
            query = query.Where(l => l.Tipo == tipo);
        }

        if (!string.IsNullOrWhiteSpace(canal) && canal != "Todos")
        {
            query = query.Where(l => l.Canal == canal);
        }

        var logs = await query
            .OrderByDescending(l => l.DataEnvio)
            .Take(100)
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPost("disparar")]
    public async Task<IActionResult> Disparar([FromBody] EnviarMensagemRequest req)
    {
        var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Id == req.ClienteId);
        if (cliente == null)
            return NotFound(new { message = "Cliente não encontrado." });

        var log = new LogComunicacao
        {
            Id = "log_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = cliente.Id,
            Tipo = req.Tipo,
            Canal = req.Canal,
            Destinatario = req.Canal == "WhatsApp" ? cliente.Telefone : cliente.Email,
            Assunto = req.Assunto,
            Conteudo = req.Mensagem,
            Status = "Enviado",
            DataEnvio = DateTime.UtcNow
        };

        _db.LogsComunicacao.Add(log);
        await _db.SaveChangesAsync();

        return Ok(log);
    }
}
