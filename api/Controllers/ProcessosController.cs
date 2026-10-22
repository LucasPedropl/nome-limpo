using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Dtos;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProcessosController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProcessosController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? status, [FromQuery] string? search)
    {
        var query = _db.Processos
            .Include(p => p.Cliente)
            .Include(p => p.Historico)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "Todos")
        {
            query = query.Where(p => p.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p => 
                p.Protocolo.ToLower().Contains(term) ||
                (p.Cliente != null && (p.Cliente.NomeRazaoSocial.ToLower().Contains(term) || p.Cliente.CpfCnpj.Contains(term))));
        }

        var lista = await query
            .OrderByDescending(p => p.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(string id)
    {
        var processo = await _db.Processos
            .Include(p => p.Cliente)
            .Include(p => p.Historico.OrderByDescending(h => h.Data))
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processo == null)
            return NotFound(new { message = "Processo não encontrado." });

        return Ok(processo);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> AtualizarStatus(string id, [FromBody] AtualizarStatusProcessoRequest req)
    {
        var processo = await _db.Processos
            .Include(p => p.Cliente)
            .Include(p => p.Historico)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (processo == null)
            return NotFound(new { message = "Processo não encontrado." });

        var statusAnterior = processo.Status;
        processo.Status = req.NovoStatus;
        processo.UpdatedAt = DateTime.UtcNow;

        if (req.NovoStatus == "Concluido" && processo.DataConclusao == null)
        {
            processo.DataConclusao = DateTime.UtcNow;
        }

        var historico = new HistoricoStatus
        {
            Id = "hist_" + Guid.NewGuid().ToString("N")[..12],
            ProcessoId = processo.Id,
            Status = req.NovoStatus,
            Titulo = string.IsNullOrWhiteSpace(req.Titulo) ? $"Transição: {statusAnterior} ➜ {req.NovoStatus}" : req.Titulo,
            Descricao = req.Descricao ?? string.Empty,
            Data = DateTime.UtcNow,
            Autor = string.IsNullOrWhiteSpace(req.Autor) ? "Operador Backoffice" : req.Autor
        };

        processo.Historico.Add(historico);

        // Se concluído, registrar log de comunicação automática conforme especificado no documento
        if (req.NovoStatus == "Concluido" && processo.Cliente != null)
        {
            _db.LogsComunicacao.Add(new LogComunicacao
            {
                Id = "log_" + Guid.NewGuid().ToString("N")[..12],
                ClienteId = processo.ClienteId,
                Tipo = "ConclusaoProcesso",
                Canal = "Email",
                Destinatario = processo.Cliente.Email,
                Assunto = $"Seu processo foi concluído com sucesso! Protocolo {processo.Protocolo}",
                Conteudo = $"Parabéns {processo.Cliente.NomeRazaoSocial}! A baixa das restrições nos birôs externos foi confirmada perante o protocolo {processo.Protocolo}.",
                Status = "Enviado",
                DataEnvio = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        return Ok(processo);
    }

    [HttpPost("{id}/notas")]
    public async Task<IActionResult> AdicionarNota(string id, [FromBody] AdicionarNotaRequest req)
    {
        var processo = await _db.Processos.FirstOrDefaultAsync(p => p.Id == id);
        if (processo == null)
            return NotFound(new { message = "Processo não encontrado." });

        if (!string.IsNullOrWhiteSpace(req.Observacao))
        {
            var dataAtual = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm");
            processo.Observacoes = string.IsNullOrWhiteSpace(processo.Observacoes)
                ? $"[{dataAtual}] {req.Observacao}"
                : $"{processo.Observacoes}\n[{dataAtual}] {req.Observacao}";
            processo.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        return Ok(processo);
    }
}
