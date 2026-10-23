using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Models;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

public record SolicitarOtpRequest(string Email);
public record ValidarOtpRequest(string Email, string Codigo);
public record IniciarPixRequest(
    string NomeRazaoSocial,
    string CpfCnpj,
    string Email,
    string Telefone,
    string TipoPessoa,
    decimal? Valor
);
public record ConcluirCheckoutRequest(
    string NomeRazaoSocial,
    string CpfCnpj,
    string Email,
    string Telefone,
    string TipoPessoa,
    string? DataNascimentoFundacao,
    string? TxId
);

[ApiController]
[Route("api/public/[controller]")]
public class CheckoutController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, (string Code, DateTime ExpiresAt)> OtpStore = new();
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly PixService _pixService;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public CheckoutController(
        AppDbContext db,
        IEmailService emailService,
        PixService pixService,
        IConfiguration config,
        IWebHostEnvironment env)
    {
        _db = db;
        _emailService = emailService;
        _pixService = pixService;
        _config = config;
        _env = env;
    }

    [HttpPost("solicitar-otp")]
    public async Task<IActionResult> SolicitarOtp([FromBody] SolicitarOtpRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "E-mail é obrigatório." });

        var email = req.Email.Trim().ToLower();
        var code = new Random().Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(10);

        OtpStore[email] = (code, expiresAt);

        // Dispara e-mail real / log
        await _emailService.SendOtpEmailAsync(email, code);

        return Ok(new
        {
            success = true,
            message = $"Código de validação de 6 dígitos enviado para {email}.",
            expiresAt,
            simulatedCode = _env.IsDevelopment() ? code : null // Exposto apenas em Development
        });
    }

    [HttpPost("validar-otp")]
    public IActionResult ValidarOtp([FromBody] ValidarOtpRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Codigo))
            return BadRequest(new { valid = false, message = "E-mail e código são obrigatórios." });

        var email = req.Email.Trim().ToLower();
        var code = req.Codigo.Trim().Replace(" ", "");

        // Código mestre aceito apenas em Development
        if (_env.IsDevelopment() && code == "123456")
        {
            return Ok(new { valid = true, message = "Código validado com sucesso!" });
        }

        if (OtpStore.TryGetValue(email, out var stored))
        {
            if (DateTime.UtcNow > stored.ExpiresAt)
            {
                OtpStore.TryRemove(email, out _);
                return BadRequest(new { valid = false, message = "Código expirado. Solicite um novo." });
            }

            if (stored.Code == code)
            {
                OtpStore.TryRemove(email, out _);
                return Ok(new { valid = true, message = "Código validado com sucesso!" });
            }
        }

        return BadRequest(new { valid = false, message = "Código inválido ou não encontrado." });
    }

    [HttpPost("iniciar-pix")]
    public IActionResult IniciarPix([FromBody] IniciarPixRequest req)
    {
        var valor = req.Valor ?? 100.00m;
        var txid = "NL" + DateTime.UtcNow.ToString("yyMMddHHmmss") + new Random().Next(100, 999);
        var chavePix = _config["PixSettings:ChavePix"] ?? "uai@uaipdv.com.br";
        var recebedor = _config["PixSettings:Recebedor"] ?? "NOME LIMPO EXPRESS LTDA";
        var cidade = _config["PixSettings:Cidade"] ?? "BELO HORIZONTE";

        var (pixEmv, qrCodeUrl) = _pixService.GerarPixEmv(chavePix, recebedor, cidade, valor, txid);
        var expiresAt = DateTime.UtcNow.AddMinutes(15);

        return Ok(new
        {
            txid,
            amount = valor,
            pixEmv,
            qrCodeUrl,
            expiresAt,
            status = "PENDING",
            subscriptionId = $"SUB-{txid}",
            recurrentIntervalDays = 30
        });
    }

    [HttpPost("concluir")]
    public async Task<IActionResult> Concluir([FromBody] ConcluirCheckoutRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NomeRazaoSocial) || string.IsNullOrWhiteSpace(req.CpfCnpj) || string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Dados cadastrais incompletos." });

        var cleanCpfCnpj = req.CpfCnpj.Trim();
        var cleanEmail = req.Email.Trim().ToLower();

        // Verifica se cliente já existe
        var cliente = await _db.Clientes
            .Include(c => c.Processos)
            .Include(c => c.Assinaturas)
            .FirstOrDefaultAsync(c => c.CpfCnpj == cleanCpfCnpj || c.Email == cleanEmail);

        if (cliente == null)
        {
            cliente = new Cliente
            {
                Id = "cli_" + Guid.NewGuid().ToString("N")[..12],
                TipoPessoa = req.TipoPessoa == "PJ" ? "PJ" : "PF",
                NomeRazaoSocial = req.NomeRazaoSocial.Trim(),
                CpfCnpj = cleanCpfCnpj,
                Email = cleanEmail,
                Telefone = req.Telefone.Trim(),
                DataNascimentoFundacao = req.DataNascimentoFundacao,
                Status = "Ativo",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Clientes.Add(cliente);
        }
        else
        {
            cliente.Status = "Ativo";
            cliente.UpdatedAt = DateTime.UtcNow;
        }

        // Gera novo protocolo de atendimento do processo de regularização
        var protocolo = $"NL-{DateTime.UtcNow:yyyy}-{new Random().Next(1000, 9999)}";
        var dataPrevista = DateTime.UtcNow.AddDays(45); // 30 a 45 dias úteis

        var processo = new Processo
        {
            Id = "prc_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = cliente.Id,
            Protocolo = protocolo,
            Status = "EmProcessamento",
            BirosNotificados = "Serasa Experian, SPC Brasil, Boa Vista SCPC",
            DataInicio = DateTime.UtcNow,
            DataPrevistaConclusao = dataPrevista,
            GarantiaValida = true,
            Observacoes = "Processo contratado e ativado via Landing Page pública. Pagamento PIX R$ 100 liquidado.",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        processo.Historico.Add(new HistoricoStatus
        {
            Id = "hist_" + Guid.NewGuid().ToString("N")[..12],
            ProcessoId = processo.Id,
            Status = "EmProcessamento",
            Titulo = "Processo Ativado e Ofícios em Confecção",
            Descricao = "Pagamento da primeira mensalidade identificado com sucesso. Notificação extrajudicial aos birôs encaminhada para expedição.",
            Data = DateTime.UtcNow,
            Autor = "Checkout Automático"
        });

        // Assinatura Mensal R$ 100,00
        var assinatura = new Assinatura
        {
            Id = "sub_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = cliente.Id,
            ValorMensal = 100.00m,
            Status = "Ativa",
            DataInicio = DateTime.UtcNow,
            ProximoVencimento = DateTime.UtcNow.AddMonths(1),
            DiaVencimento = DateTime.UtcNow.Day,
            CreatedAt = DateTime.UtcNow
        };

        var cobranca = new Cobranca
        {
            Id = "cob_" + Guid.NewGuid().ToString("N")[..12],
            AssinaturaId = assinatura.Id,
            ClienteId = cliente.Id,
            Valor = 100.00m,
            ReferenciaMes = DateTime.UtcNow.ToString("yyyy-MM"),
            Status = "Pago",
            TxId = req.TxId ?? ("NL" + DateTime.UtcNow.ToString("yyMMddHHmmss")),
            DataVencimento = DateTime.UtcNow,
            DataPagamento = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        assinatura.Cobrancas.Add(cobranca);

        // Dispara e-mail de ativação do serviço
        await _emailService.SendActivationEmailAsync(cliente.Email, cliente.NomeRazaoSocial, protocolo, dataPrevista);

        // Registra log da comunicação
        cliente.Comunicacoes.Add(new LogComunicacao
        {
            Id = "log_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = cliente.Id,
            Tipo = "AtivacaoServico",
            Canal = "Email",
            Destinatario = cliente.Email,
            Assunto = $"Serviço Ativado — Protocolo {protocolo}",
            Conteudo = $"Serviço de manutenção de nome limpo e regularização cadastral ativado com sucesso. Protocolo: {protocolo}. Previsão: {dataPrevista:dd/MM/yyyy}.",
            Status = "Enviado",
            DataEnvio = DateTime.UtcNow
        });

        _db.Processos.Add(processo);
        _db.Assinaturas.Add(assinatura);

        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            protocolNumber = protocolo,
            contractDate = DateTime.UtcNow.ToString("dd/MM/yyyy"),
            estimatedCompletionDate = dataPrevista.ToString("dd/MM/yyyy"),
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

    [HttpGet("consulta/{termo}")]
    public async Task<IActionResult> ConsultarProcessoPublico(string termo)
    {
        if (string.IsNullOrWhiteSpace(termo))
            return BadRequest(new { message = "Informe o protocolo ou CPF/CNPJ." });

        var clean = termo.Trim();

        var processo = await _db.Processos
            .Include(p => p.Cliente)
            .Include(p => p.Historico.OrderByDescending(h => h.Data))
            .FirstOrDefaultAsync(p => p.Protocolo == clean || (p.Cliente != null && p.Cliente.CpfCnpj == clean));

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
