using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Dtos;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<DashboardMetricsDto>> GetMetrics()
    {
        var totalClientes = await _db.Clientes.CountAsync();
        var clientesAtivos = await _db.Clientes.CountAsync(c => c.Status == "Ativo");
        var clientesInadimplentes = await _db.Clientes.CountAsync(c => c.Status == "Inadimplente");

        var processosEmAndamento = await _db.Processos.CountAsync(p => 
            p.Status == "EmProcessamento" || p.Status == "NotificacaoBiro" || p.Status == "EmAnalise");
        var processosConcluidos = await _db.Processos.CountAsync(p => p.Status == "Concluido");

        // Assinaturas ativas * R$ 100/mês
        var mrr = await _db.Assinaturas.Where(a => a.Status == "Ativa").SumAsync(a => a.ValorMensal);

        var mesAtual = DateTime.UtcNow.ToString("yyyy-MM");
        var receitaTotalMes = await _db.Cobrancas
            .Where(c => c.Status == "Pago" && c.ReferenciaMes == mesAtual)
            .SumAsync(c => c.Valor);

        var totalFinalizados = processosConcluidos + await _db.Processos.CountAsync(p => p.Status == "Cancelado");
        var taxaSucesso = totalFinalizados > 0 
            ? Math.Round((double)processosConcluidos / totalFinalizados * 100, 1) 
            : 98.4; // Taxa média inicial

        var limitePrazo = DateTime.UtcNow.AddDays(7);
        var processosPertoVencimento = await _db.Processos
            .CountAsync(p => p.Status != "Concluido" && p.Status != "Cancelado" && p.DataPrevistaConclusao <= limitePrazo);

        return Ok(new DashboardMetricsDto(
            TotalClientes: totalClientes,
            ClientesAtivos: clientesAtivos,
            ClientesInadimplentes: clientesInadimplentes,
            ProcessosEmAndamento: processosEmAndamento,
            ProcessosConcluidos: processosConcluidos,
            ReceitaMensalRecorrente: mrr,
            ReceitaTotalMesAtual: receitaTotalMes,
            TaxaSucessoPercentual: taxaSucesso,
            ProcessosPertoVencimentoPrazo: processosPertoVencimento
        ));
    }
}
