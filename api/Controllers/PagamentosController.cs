using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Dtos;
using NomeLimpo.Api.Models;
using NomeLimpo.Api.Services;

namespace NomeLimpo.Api.Controllers;

[ApiController]
[Route("api/public/[controller]")]
[AllowAnonymous]
public class PagamentosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBixsService _bixsService;
    private readonly PixService _pixService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ILogger<PagamentosController> _logger;
    private readonly IWebHostEnvironment _env;
    private readonly TokenService _tokenService;

    public PagamentosController(
        AppDbContext db,
        IBixsService bixsService,
        PixService pixService,
        IEmailService emailService,
        IConfiguration config,
        ILogger<PagamentosController> logger,
        IWebHostEnvironment env,
        TokenService tokenService)
    {
        _env = env;
        _tokenService = tokenService;
        _db = db;
        _bixsService = bixsService;
        _pixService = pixService;
        _emailService = emailService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Gera a cobrança da 1ª mensalidade via PIX no Bixs Cora Gateway para adesão ao plano.
    /// Em Development, se as credenciais Bixs não estiverem ativas, utiliza contingência local com PIX EMV estático;
    /// fora de Development retorna 503 (um PIX estático nunca seria conciliado pelo webhook).
    /// </summary>
    [HttpPost("iniciar")]
    [HttpPost("/api/public/checkout/iniciar-pix")]
    public async Task<IActionResult> IniciarPagamento([FromBody] IniciarPagamentoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NomeRazaoSocial) || string.IsNullOrWhiteSpace(req.CpfCnpj) || string.IsNullOrWhiteSpace(req.Email))
        {
            return BadRequest(new { error = "Nome, CPF/CNPJ e e-mail são obrigatórios para emissão do PIX." });
        }

        var cleanDoc = Regex.Replace(req.CpfCnpj.Trim(), @"\D", "");
        var cleanPhone = Regex.Replace(req.Telefone ?? string.Empty, @"\D", "");
        var cleanEmail = req.Email.Trim().ToLowerInvariant();
        var docType = cleanDoc.Length > 11 ? "CNPJ" : "CPF";
        var tipoPessoa = req.TipoPessoa == "PJ" || cleanDoc.Length > 11 ? "PJ" : "PF";

        // Preço da mensalidade é do servidor; o "valor" enviado pelo cliente é ignorado
        decimal amount = ValorMensalidade();
        int amountInCents = (int)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);

        // 0. Comprovante do e-mail (POST /api/public/checkout/validar-otp), amarrado a este CPF/CNPJ.
        // Checkout:ExigirVerificacaoEmail=false desliga a etapa (demonstração sem SMTP): qualquer um gera PIX para qualquer CPF.
        var exigirVerificacaoEmail = _config.GetValue("Checkout:ExigirVerificacaoEmail", true);
        var verificacao = exigirVerificacaoEmail
            ? _tokenService.ValidateCheckoutVerificationToken(req.VerificationToken)
            : null;
        if (exigirVerificacaoEmail && (verificacao is null || verificacao.Value.Documento != cleanDoc))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Confirme seu e-mail com o código enviado antes de gerar o PIX." });
        }

        // 1. Localiza (só pelo CPF/CNPJ) ou cria o Cliente
        var cliente = await _db.Clientes
            .Include(c => c.Assinaturas)
                .ThenInclude(a => a.Cobrancas)
            .Include(c => c.Processos)
            .FirstOrDefaultAsync(c => c.CpfCnpj.Replace(".", "").Replace("-", "").Replace("/", "") == cleanDoc);

        // Cadastro existente: o código tem que ter ido para o e-mail do cadastro; novo: para o e-mail informado
        var emailEsperado = cliente is null ? cleanEmail : cliente.Email.Trim().ToLowerInvariant();
        if (exigirVerificacaoEmail && verificacao!.Value.Email != emailEsperado)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Confirme seu e-mail com o código enviado antes de gerar o PIX." });
        }

        if (cliente is null)
        {
            cliente = new Cliente
            {
                Id = "cli_" + Guid.NewGuid().ToString("N")[..12],
                TipoPessoa = tipoPessoa,
                NomeRazaoSocial = req.NomeRazaoSocial.Trim(),
                CpfCnpj = req.CpfCnpj.Trim(),
                Email = cleanEmail,
                Telefone = string.IsNullOrWhiteSpace(req.Telefone) ? cleanPhone : req.Telefone.Trim(),
                DataNascimentoFundacao = req.DataNascimentoFundacao,
                Status = "Pendente",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Clientes.Add(cliente);
        }
        // Cadastro existente não é alterado por aqui: nome, telefone e e-mail só mudam pelo backoffice

        // 2. Garante que exista uma Assinatura vinculada
        var assinatura = cliente.Assinaturas.FirstOrDefault(a => a.Status == "Ativa" || a.Status == "Pendente");
        if (assinatura is null)
        {
            assinatura = new Assinatura
            {
                Id = "sub_" + Guid.NewGuid().ToString("N")[..12],
                ClienteId = cliente.Id,
                ValorMensal = amount,
                Status = "Pendente",
                DataInicio = DateTime.UtcNow,
                ProximoVencimento = DateTime.UtcNow.AddMonths(1),
                DiaVencimento = DateTime.UtcNow.Day,
                CreatedAt = DateTime.UtcNow
            };
            _db.Assinaturas.Add(assinatura);
        }

        // 3. Verifica se já existe cobrança PENDENTE gerada há menos de 25 minutos com PixEmv válido (Reuso idêntico ao Contratos)
        var existingPending = await _db.Cobrancas
            .Where(c => c.ClienteId == cliente.Id && c.Status == "Pendente" && !string.IsNullOrEmpty(c.PixEmv) && c.AmountCents == amountInCents)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (existingPending is not null && DateTime.UtcNow - existingPending.CreatedAt < TimeSpan.FromMinutes(25))
        {
            return Ok(new PaymentResultDto
            {
                PaymentId = existingPending.Id,
                TxId = existingPending.TxId,
                ClienteId = cliente.Id,
                AssinaturaId = assinatura.Id,
                AmountCents = existingPending.AmountCents,
                Amount = existingPending.Valor,
                Status = existingPending.Status,
                PixEmv = existingPending.PixEmv,
                QrCodeUrl = existingPending.QrCodeUrl,
                CoraInvoiceId = existingPending.CoraInvoiceId,
                ExternalCode = existingPending.ExternalCode,
                BankSlipUrl = existingPending.BankSlipUrl,
                DueDate = existingPending.DataVencimento.ToString("yyyy-MM-dd"),
                ExpiresAt = existingPending.CreatedAt.AddMinutes(25).ToString("o"),
                CreatedAt = existingPending.CreatedAt.ToString("o")
            });
        }

        // 4. Prepara parâmetros para o Gateway Bixs
        var externalCode = $"nl_{cliente.Id}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        var dueDateStr = !string.IsNullOrWhiteSpace(req.DueDate)
            ? req.DueDate
            : DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-dd");

        var address = req.Endereco ?? new AddressDto
        {
            Street = "Av. Principal",
            Number = "100",
            District = "Centro",
            City = "Belo Horizonte",
            State = "MG",
            ZipCode = "30140071",
            Country = "BRA"
        };

        var telefoneCobranca = Regex.Replace(cliente.Telefone ?? string.Empty, @"\D", "");
        var paymentRequest = new PaymentRequestDto
        {
            Amount = amountInCents,
            PaymentType = "pix",
            ExternalCode = externalCode,
            DueDate = dueDateStr,
            ServiceName = "1ª Mensalidade - Nome Limpo Express",
            ServiceDesc = "Assinatura do serviço de manutenção e regularização de nome limpo para CPF/CNPJ.",
            CustomerPayment = new CustomerPaymentRequestDto
            {
                Name = cliente.NomeRazaoSocial,
                Email = cliente.Email,
                Phone = string.IsNullOrWhiteSpace(telefoneCobranca) ? "31999999999" : telefoneCobranca,
                Document = string.IsNullOrWhiteSpace(cleanDoc) ? "00000000000" : cleanDoc,
                DocumentType = docType,
                Address = address
            }
        };

        string pixEmv;
        string? coraInvoiceId = null;
        string? bankSlipUrl = null;
        string? barcode = null;
        string? digitableLine = null;

        // 5. Tentativa de chamada ao Gateway Bixs oficial
        try
        {
            var bixsResult = await _bixsService.CreatePaymentInvoiceAsync(paymentRequest);
            if (bixsResult is not null && !string.IsNullOrEmpty(bixsResult.PixEmv))
            {
                pixEmv = bixsResult.PixEmv;
                coraInvoiceId = bixsResult.CoraInvoiceId;
                bankSlipUrl = bixsResult.BankSlipUrl;
                barcode = bixsResult.Barcode;
                digitableLine = bixsResult.DigitableLine;
            }
            else
            {
                throw new BixsException("Bixs retornou fatura vazia.");
            }
        }
        catch (Exception ex) when (!_env.IsDevelopment())
        {
            _logger.LogError(ex, "Gateway Bixs não respondeu com sucesso ou credenciais pendentes. Cobrança PIX não emitida.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "Não foi possível gerar o Pix agora. Tente novamente em alguns minutos." });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gateway Bixs não respondeu com sucesso ou credenciais pendentes. Ativando emissão PIX local (Development).");
            var chavePix = _config["PixSettings:ChavePix"] ?? "uai@uaipdv.com.br";
            var recebedor = _config["PixSettings:Recebedor"] ?? "NOME LIMPO EXPRESS LTDA";
            var cidade = _config["PixSettings:Cidade"] ?? "BELO HORIZONTE";
            var (localEmv, _) = _pixService.GerarPixEmv(chavePix, recebedor, cidade, amount, externalCode);
            pixEmv = localEmv;
        }

        var qrCodeUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={Uri.EscapeDataString(pixEmv)}";
        var now = DateTime.UtcNow;

        var cobranca = new Cobranca
        {
            Id = "cob_" + Guid.NewGuid().ToString("N")[..12],
            AssinaturaId = assinatura.Id,
            ClienteId = cliente.Id,
            Valor = amount,
            AmountCents = amountInCents,
            ReferenciaMes = now.ToString("yyyy-MM"),
            Status = "Pendente",
            TxId = externalCode,
            PixEmv = pixEmv,
            PixCopiaECola = pixEmv,
            QrCodeUrl = qrCodeUrl,
            CoraInvoiceId = coraInvoiceId,
            ExternalCode = externalCode,
            BankSlipUrl = bankSlipUrl,
            Barcode = barcode,
            DigitableLine = digitableLine,
            DataVencimento = DateTime.TryParse(dueDateStr, out var dDate) ? dDate : now.AddDays(3),
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Cobrancas.Add(cobranca);
        await _db.SaveChangesAsync();

        return Ok(new PaymentResultDto
        {
            PaymentId = cobranca.Id,
            TxId = cobranca.TxId,
            ClienteId = cliente.Id,
            AssinaturaId = assinatura.Id,
            AmountCents = cobranca.AmountCents,
            Amount = cobranca.Valor,
            Status = cobranca.Status,
            PixEmv = cobranca.PixEmv,
            QrCodeUrl = cobranca.QrCodeUrl,
            CoraInvoiceId = cobranca.CoraInvoiceId,
            ExternalCode = cobranca.ExternalCode,
            BankSlipUrl = cobranca.BankSlipUrl,
            DueDate = cobranca.DataVencimento.ToString("yyyy-MM-dd"),
            ExpiresAt = now.AddMinutes(25).ToString("o"),
            CreatedAt = now.ToString("o")
        });
    }

    /// <summary>
    /// Consulta o status do pagamento em tempo real (usado para polling automático na landing page).
    /// Caso confirmado, ativa o cliente e já retorna o Token JWT para login imediato no sistema.
    /// </summary>
    [HttpGet("{id}/status")]
    [HttpGet("txid/{txid}/status")]
    public async Task<IActionResult> GetPaymentStatus(string? id, string? txid)
    {
        var key = !string.IsNullOrWhiteSpace(id) ? id.Trim() : (!string.IsNullOrWhiteSpace(txid) ? txid.Trim() : string.Empty);
        if (string.IsNullOrEmpty(key))
        {
            return BadRequest(new { error = "Identificador de cobrança não informado." });
        }

        var cobranca = await _db.Cobrancas
            .Include(c => c.Assinatura)
            .FirstOrDefaultAsync(c => c.Id == key || c.TxId == key || c.ExternalCode == key);

        if (cobranca is null)
        {
            return NotFound(new { error = "Cobrança não encontrada." });
        }

        var cliente = await _db.Clientes
            .Include(c => c.Processos)
            .FirstOrDefaultAsync(c => c.Id == cobranca.ClienteId);

        // Se está pendente e temos o ID da Cora/Bixs, consulta o gateway
        if (cobranca.Status != "Pago" && !string.IsNullOrEmpty(cobranca.CoraInvoiceId))
        {
            try
            {
                var invoiceStatus = await _bixsService.GetPaymentInvoiceAsync(cobranca.CoraInvoiceId);
                if (string.Equals(invoiceStatus?.Status, "PAID", StringComparison.OrdinalIgnoreCase)
                    && ValorPagoConfere(cobranca, invoiceStatus!))
                {
                    await AtivarClienteEProcessoAsync(cobranca, cliente);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao checar status da fatura Bixs {InvoiceId}", cobranca.CoraInvoiceId);
            }
        }

        var isPaid = cobranca.Status == "Pago";

        // Sem token nem dados do titular: os ids da cobrança não são segredo (Id tem 48 bits, TxId deriva do id do cliente).
        // O login é feito na Área do Cliente com o código enviado ao e-mail cadastrado.
        return Ok(new PaymentStatusResponse
        {
            PaymentId = cobranca.Id,
            TxId = cobranca.TxId,
            Status = isPaid ? "PAID" : cobranca.Status,
            IsPaid = isPaid,
            PaidAt = cobranca.DataPagamento?.ToString("o"),
            Amount = cobranca.Valor,
            Protocolo = isPaid ? cliente?.Processos.FirstOrDefault()?.Protocolo : null
        });
    }

    /// <summary>
    /// Simulação / Confirmação direta de pagamento (Ambiente de Teste/Homologação idêntico ao Contratos).
    /// </summary>
    [HttpPost("{id}/confirm-test")]
    [HttpPost("txid/{txid}/confirm-test")]
    public async Task<IActionResult> ConfirmPaymentTest(string? id, string? txid)
    {
        // Endpoint anônimo que marca a cobrança como paga: disponível apenas em Development
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var key = !string.IsNullOrWhiteSpace(id) ? id.Trim() : (!string.IsNullOrWhiteSpace(txid) ? txid.Trim() : string.Empty);
        if (string.IsNullOrEmpty(key))
        {
            return BadRequest(new { error = "Identificador de cobrança não informado para teste." });
        }

        var cobranca = await _db.Cobrancas
            .Include(c => c.Assinatura)
            .FirstOrDefaultAsync(c => c.Id == key || c.TxId == key || c.ExternalCode == key);

        if (cobranca is null)
        {
            return NotFound(new { error = "Cobrança não encontrada para confirmação de teste." });
        }

        var cliente = await _db.Clientes
            .Include(c => c.Processos)
            .FirstOrDefaultAsync(c => c.Id == cobranca.ClienteId);

        await AtivarClienteEProcessoAsync(cobranca, cliente);

        var protocolo = cliente?.Processos.FirstOrDefault()?.Protocolo;

        // Mesmo contrato do status em produção: sem token, o login é pela Área do Cliente
        return Ok(new
        {
            ok = true,
            isPaid = true,
            status = "PAID",
            message = "Pagamento da 1ª mensalidade confirmado com sucesso (modo teste/aprovação imediata).",
            paymentId = cobranca.Id,
            txId = cobranca.TxId,
            amount = cobranca.Valor,
            protocolo
        });
    }

    /// <summary>
    /// Webhook para receber notificações de repasse e pagamento da Bixs Cora Gateway.
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> HandleBixsWebhook([FromBody] PagamentoRepasse? repasse)
    {
        if (repasse?.Data is null)
        {
            return BadRequest(new { error = "Payload inválido." });
        }

        var externalCode = repasse.Data.ExternalCode;
        var invoiceId = repasse.Data.CoraInvoiceId ?? repasse.Data.InvoiceId;

        if (string.IsNullOrWhiteSpace(externalCode) && string.IsNullOrWhiteSpace(invoiceId))
        {
            return BadRequest(new { error = "Identificadores de cobrança ausentes no webhook." });
        }

        var cobranca = await _db.Cobrancas
            .Include(c => c.Assinatura)
            .FirstOrDefaultAsync(c => (!string.IsNullOrEmpty(externalCode) && (c.ExternalCode == externalCode || c.TxId == externalCode))
                                   || (!string.IsNullOrEmpty(invoiceId) && c.CoraInvoiceId == invoiceId));

        if (cobranca is null)
        {
            _logger.LogWarning("Webhook Bixs recebido para cobrança não encontrada: ExternalCode={ExtCode}, InvoiceId={InvoiceId}",
                externalCode, invoiceId);
            return Ok(new { received = true, note = "Cobrança não localizada." });
        }

        var status = repasse.Data.Status?.ToUpperInvariant();
        if (status == "PAID" && cobranca.Status != "Pago")
        {
            // Webhook é anônimo e sem assinatura: só confirma se a própria Bixs disser que a fatura que NÓS emitimos está paga.
            // Nunca usa o invoiceId enviado por quem chamou (seria a fatura paga de outra pessoa).
            if (string.IsNullOrEmpty(cobranca.CoraInvoiceId))
            {
                _logger.LogWarning("Webhook Bixs informou PAID para {CobrancaId}, que não tem fatura Bixs registrada. Ignorado.", cobranca.Id);
                return Ok(new { received = true, note = "Pagamento não confirmado." });
            }

            var invoice = await _bixsService.GetPaymentInvoiceAsync(cobranca.CoraInvoiceId);
            if (!string.Equals(invoice?.Status, "PAID", StringComparison.OrdinalIgnoreCase) || !ValorPagoConfere(cobranca, invoice!))
            {
                _logger.LogWarning("Webhook Bixs informou PAID para {CobrancaId}, mas a fatura não foi confirmada na consulta.", cobranca.Id);
                return Ok(new { received = true, note = "Pagamento não confirmado." });
            }

            var cliente = await _db.Clientes
                .Include(c => c.Processos)
                .FirstOrDefaultAsync(c => c.Id == cobranca.ClienteId);

            await AtivarClienteEProcessoAsync(cobranca, cliente);
            _logger.LogInformation("Pagamento {CobrancaId} confirmado via Webhook Bixs!", cobranca.Id);
        }

        return Ok(new { received = true });
    }

    private decimal ValorMensalidade()
    {
        var configured = _config.GetValue<decimal?>("Pagamento:ValorMensalidade");
        return configured is > 0 ? configured.Value : 100.00m;
    }

    /// <summary>
    /// Confere o valor que a Bixs informa como pago (total_paid, em centavos como o amount enviado) com o valor da cobrança.
    /// Se a Bixs não trouxer total_paid, usa o total da fatura (amount).
    /// </summary>
    private bool ValorPagoConfere(Cobranca cobranca, PaymentResponseDto invoice)
    {
        var pagoCents = invoice.TotalPaid > 0 ? invoice.TotalPaid : invoice.Amount;
        if (pagoCents >= cobranca.AmountCents && cobranca.AmountCents > 0)
            return true;

        _logger.LogWarning(
            "Fatura Bixs {InvoiceId} paga com valor abaixo do esperado para {CobrancaId}: pago {PagoCents} centavos ({Campo}), esperado {EsperadoCents}. Não marcada como paga.",
            cobranca.CoraInvoiceId, cobranca.Id, pagoCents, invoice.TotalPaid > 0 ? "total_paid" : "amount", cobranca.AmountCents);
        return false;
    }

    private async Task AtivarClienteEProcessoAsync(Cobranca cobranca, Cliente? cliente)
    {
        cobranca.Status = "Pago";
        cobranca.DataPagamento = DateTime.UtcNow;
        cobranca.UpdatedAt = DateTime.UtcNow;

        if (cobranca.Assinatura is not null)
        {
            cobranca.Assinatura.Status = "Ativa";
            cobranca.Assinatura.ProximoVencimento = DateTime.UtcNow.AddMonths(1);
        }

        if (cliente is not null)
        {
            cliente.Status = "Ativo";
            cliente.UpdatedAt = DateTime.UtcNow;

            // Se não tem processo criado, cria o processo de regularização imediatamente
            var processo = cliente.Processos.FirstOrDefault();
            if (processo is null)
            {
                var protocolo = $"NL-{DateTime.UtcNow:yyyy}-{new Random().Next(1000, 9999)}";
                var dataPrevista = DateTime.UtcNow.AddDays(45);

                processo = new Processo
                {
                    Id = "prc_" + Guid.NewGuid().ToString("N")[..12],
                    ClienteId = cliente.Id,
                    Protocolo = protocolo,
                    Status = "EmProcessamento",
                    BirosNotificados = "Serasa Experian, SPC Brasil, Boa Vista SCPC",
                    DataInicio = DateTime.UtcNow,
                    DataPrevistaConclusao = dataPrevista,
                    GarantiaValida = true,
                    Observacoes = "Processo ativado via PIX da 1ª mensalidade na Landing Page.",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                processo.Historico.Add(new HistoricoStatus
                {
                    Id = "hist_" + Guid.NewGuid().ToString("N")[..12],
                    ProcessoId = processo.Id,
                    Status = "EmProcessamento",
                    Titulo = "1ª Mensalidade Liquidada e Ofícios Emitidos",
                    Descricao = "Pagamento da 1ª mensalidade de R$ 100,00 confirmado com sucesso. Regularização cadastral em andamento.",
                    Data = DateTime.UtcNow,
                    Autor = "Gateway Bixs / Cora"
                });

                _db.Processos.Add(processo);
                cliente.Processos.Add(processo);

                // Envia e-mail de ativação e de recibo
                try
                {
                    await _emailService.SendPaymentReceiptEmailAsync(cliente.Email, cliente.NomeRazaoSocial, protocolo, cobranca.Valor, cobranca.TxId);
                    await _emailService.SendActivationEmailAsync(cliente.Email, cliente.NomeRazaoSocial, protocolo, dataPrevista);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Falha no envio de e-mails de confirmação de pagamento para {Email}", cliente.Email);
                }
            }
        }

        await _db.SaveChangesAsync();
    }
}
