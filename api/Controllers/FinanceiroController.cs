using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Dtos;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinanceiroController : ControllerBase
{
    private readonly AppDbContext _db;

    public FinanceiroController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("assinaturas")]
    public async Task<IActionResult> ListarAssinaturas([FromQuery] string? status)
    {
        var query = _db.Assinaturas
            .Include(a => a.Cliente)
            .Include(a => a.Cobrancas.OrderByDescending(c => c.DataVencimento))
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "Todos")
        {
            query = query.Where(a => a.Status == status);
        }

        var lista = await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("cobrancas")]
    public async Task<IActionResult> ListarCobrancas([FromQuery] string? status, [FromQuery] string? mes)
    {
        var query = _db.Cobrancas
            .Include(c => c.Assinatura)
                .ThenInclude(a => a!.Cliente)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "Todos")
        {
            query = query.Where(c => c.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(mes))
        {
            query = query.Where(c => c.ReferenciaMes == mes);
        }

        var lista = await query
            .OrderByDescending(c => c.DataVencimento)
            .Take(100)
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPost("cobrancas/{id}/confirmar-pagamento")]
    public async Task<IActionResult> ConfirmarPagamento(string id)
    {
        var cobranca = await _db.Cobrancas
            .Include(c => c.Assinatura)
                .ThenInclude(a => a!.Cliente)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cobranca == null)
            return NotFound(new { message = "Cobrança não encontrada." });

        if (cobranca.Status == "Pago")
            return BadRequest(new { message = "Cobrança já se encontra liquidada." });

        cobranca.Status = "Pago";
        cobranca.DataPagamento = DateTime.UtcNow;

        if (cobranca.Assinatura != null)
        {
            cobranca.Assinatura.Status = "Ativa";
            cobranca.Assinatura.ProximoVencimento = DateTime.UtcNow.AddMonths(1);

            if (cobranca.Assinatura.Cliente != null)
            {
                cobranca.Assinatura.Cliente.Status = "Ativo";

                // Log de comunicação de renovação
                _db.LogsComunicacao.Add(new LogComunicacao
                {
                    Id = "log_" + Guid.NewGuid().ToString("N")[..12],
                    ClienteId = cobranca.Assinatura.ClienteId,
                    Tipo = "ConfirmacaoPagamento",
                    Canal = "Email",
                    Destinatario = cobranca.Assinatura.Cliente.Email,
                    Assunto = "Pagamento da Mensalidade Confirmado",
                    Conteudo = $"Confirmamos o recebimento do valor de R$ {cobranca.Valor:N2} referente à manutenção do Nome Limpo.",
                    Status = "Enviado",
                    DataEnvio = DateTime.UtcNow
                });
            }
        }

        await _db.SaveChangesAsync();

        return Ok(cobranca);
    }
}
