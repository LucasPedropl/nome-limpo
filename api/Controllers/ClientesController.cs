using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Dtos;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ClientesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? search, [FromQuery] string? status)
    {
        var query = _db.Clientes
            .Include(c => c.Processos)
            .Include(c => c.Assinaturas)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c => 
                c.NomeRazaoSocial.ToLower().Contains(term) ||
                c.CpfCnpj.Contains(term) ||
                c.Email.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(c => c.Status == status);
        }

        var clientes = await query
            .OrderByDescending(c => c.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(clientes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(string id)
    {
        var cliente = await _db.Clientes
            .Include(c => c.Processos)
                .ThenInclude(p => p.Historico.OrderByDescending(h => h.Data))
            .Include(c => c.Assinaturas)
                .ThenInclude(a => a.Cobrancas.OrderByDescending(cob => cob.DataVencimento))
            .Include(c => c.Comunicacoes.OrderByDescending(m => m.DataEnvio))
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cliente == null)
            return NotFound(new { message = "Cliente não encontrado." });

        return Ok(cliente);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarClienteRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NomeRazaoSocial) || string.IsNullOrWhiteSpace(req.CpfCnpj) || string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Nome, CPF/CNPJ e E-mail são obrigatórios." });

        var existe = await _db.Clientes.AnyAsync(c => c.CpfCnpj == req.CpfCnpj);
        if (existe)
            return Conflict(new { message = "Já existe um cliente cadastrado com este CPF/CNPJ." });

        var clienteId = "cli_" + Guid.NewGuid().ToString("N")[..12];
        var cliente = new Cliente
        {
            Id = clienteId,
            TipoPessoa = req.TipoPessoa == "PJ" ? "PJ" : "PF",
            NomeRazaoSocial = req.NomeRazaoSocial.Trim(),
            CpfCnpj = req.CpfCnpj.Trim(),
            Email = req.Email.Trim().ToLower(),
            Telefone = req.Telefone.Trim(),
            DataNascimentoFundacao = req.DataNascimentoFundacao,
            Status = "Ativo",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // 1. Criar Processo de Regularização
        var protocolo = $"NL-{DateTime.UtcNow:yyyy}-{new Random().Next(1000, 9999)}";
        var processo = new Processo
        {
            Id = "prc_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = clienteId,
            Protocolo = protocolo,
            Status = "EmProcessamento",
            BirosNotificados = "Serasa, SPC Brasil, Boa Vista SCPC",
            DataInicio = DateTime.UtcNow,
            DataPrevistaConclusao = DateTime.UtcNow.AddDays(45),
            GarantiaValida = true,
            Observacoes = "Processo iniciado após validação e contratação.",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        processo.Historico.Add(new HistoricoStatus
        {
            Id = "hist_" + Guid.NewGuid().ToString("N")[..12],
            ProcessoId = processo.Id,
            Status = "EmProcessamento",
            Titulo = "Processo Aberto",
            Descricao = "Documentos recepcionados. Triagem operacional e confecção dos ofícios extrajudiciais iniciada.",
            Data = DateTime.UtcNow,
            Autor = "Sistema"
        });

        // 2. Criar Assinatura Mensal R$ 100,00
        var assinatura = new Assinatura
        {
            Id = "sub_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = clienteId,
            ValorMensal = 100.00m,
            Status = "Ativa",
            DataInicio = DateTime.UtcNow,
            ProximoVencimento = DateTime.UtcNow.AddMonths(1),
            DiaVencimento = DateTime.UtcNow.Day,
            CreatedAt = DateTime.UtcNow
        };

        // 3. Primeira cobrança PIX quitada (onboarding)
        var cobranca = new Cobranca
        {
            Id = "cob_" + Guid.NewGuid().ToString("N")[..12],
            AssinaturaId = assinatura.Id,
            ClienteId = clienteId,
            Valor = 100.00m,
            ReferenciaMes = DateTime.UtcNow.ToString("yyyy-MM"),
            Status = "Pago",
            TxId = "NL" + DateTime.UtcNow.ToString("yyyyMMddHHmmss"),
            DataVencimento = DateTime.UtcNow,
            DataPagamento = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        assinatura.Cobrancas.Add(cobranca);

        // 4. Log de Comunicação inicial
        cliente.Comunicacoes.Add(new LogComunicacao
        {
            Id = "log_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = clienteId,
            Tipo = "AtivacaoServico",
            Canal = "Email",
            Destinatario = cliente.Email,
            Assunto = $"Serviço Ativado — Protocolo {protocolo}",
            Conteudo = $"Olá {cliente.NomeRazaoSocial}, seu serviço de regularização foi ativado com sucesso! Protocolo: {protocolo}.",
            Status = "Enviado",
            DataEnvio = DateTime.UtcNow
        });

        _db.Clientes.Add(cliente);
        _db.Processos.Add(processo);
        _db.Assinaturas.Add(assinatura);

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = cliente.Id }, cliente);
    }
}
