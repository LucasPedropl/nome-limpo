using System.Globalization;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NomeLimpo.Api.Data;
using NomeLimpo.Api.Models;

namespace NomeLimpo.Api.Services;

public record WhatsAppStatus(
    bool Ativo,
    bool Conectado,
    string? Telefone,
    string? InstanciaId,
    string? Erro,
    DateTime? AlteradoEm,
    string? AlteradoPor);

public record WhatsAppConexao(string InstanciaId, bool Conectado, string? QrCode);

public record WhatsAppEnvio(bool Enviado, string? Erro);

/// <summary>
/// Envio depois da resposta HTTP (Pix gerado, pagamento confirmado): o cliente não espera a Bixs.
/// Cada envio roda num escopo próprio, com o seu DbContext, e salva o log da régua no fim.
/// </summary>
public class WhatsAppEmSegundoPlano
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WhatsAppEmSegundoPlano> _logger;

    public WhatsAppEmSegundoPlano(IServiceScopeFactory scopeFactory, ILogger<WhatsAppEmSegundoPlano> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void Enviar(Func<WhatsAppService, Task> envio)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var whatsApp = scope.ServiceProvider.GetRequiredService<WhatsAppService>();
                await envio(whatsApp);
                await scope.ServiceProvider.GetRequiredService<AppDbContext>().SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha no envio de WhatsApp em segundo plano.");
            }
        });
    }
}

/// <summary>
/// Envio de WhatsApp pela instância da Bixs (número da empresa conectado por QR Code, API não oficial).
/// Começa DESLIGADO: só envia depois que alguém liga no backoffice, e pode ser desligado a qualquer momento,
/// porque disparo automático por API não oficial pode fazer o número ser banido.
/// O envio nunca derruba o fluxo de quem chama: falha vira WhatsAppEnvio.Enviado = false e log.
/// </summary>
public class WhatsAppService
{
    public const string ChaveAtivo = "WhatsApp:Ativo";
    private static readonly TimeSpan TempoMaximoEnvio = TimeSpan.FromSeconds(20);

    // Freio dos envios automáticos: o checkout é público, e sem limite qualquer um faria o número da empresa
    // mandar código para telefones aleatórios em massa (o que derruba número de API não oficial).
    // Um cadastro normal gasta 4 mensagens (código, Pix em 2 partes, confirmação). Em memória, por instância da API.
    private static readonly TimeSpan JanelaLimite = TimeSpan.FromMinutes(10);
    private static readonly List<(DateTime Em, string Numero)> EnviosAutomaticos = new();

    private readonly AppDbContext _db;
    private readonly IBixsService _bixs;
    private readonly IConfiguration _config;
    private readonly ILogger<WhatsAppService> _logger;

    public WhatsAppService(AppDbContext db, IBixsService bixs, IConfiguration config, ILogger<WhatsAppService> logger)
    {
        _db = db;
        _bixs = bixs;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Chave gravada pelo backoffice; sem ela vale WhatsApp:Ativo da configuração (padrão: desligado).
    /// A configuração serve para manter ligado quando o banco é recriado (SQLite provisório em /tmp no Render).
    /// </summary>
    public async Task<bool> IsAtivoAsync()
    {
        var salvo = await _db.ConfiguracoesSistema.AsNoTracking().FirstOrDefaultAsync(c => c.Chave == ChaveAtivo);
        return salvo is not null ? salvo.Valor == "true" : _config.GetValue("WhatsApp:Ativo", false);
    }

    public async Task SetAtivoAsync(bool ativo, string? alteradoPor)
    {
        var salvo = await _db.ConfiguracoesSistema.FirstOrDefaultAsync(c => c.Chave == ChaveAtivo);
        if (salvo is null)
        {
            salvo = new ConfiguracaoSistema { Chave = ChaveAtivo };
            _db.ConfiguracoesSistema.Add(salvo);
        }
        salvo.Valor = ativo ? "true" : "false";
        salvo.AlteradoPor = alteradoPor;
        salvo.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        _logger.LogInformation("WhatsApp {Estado} por {Usuario}", ativo ? "LIGADO" : "DESLIGADO", alteradoPor ?? "desconhecido");
    }

    public async Task<WhatsAppStatus> GetStatusAsync()
    {
        var salvo = await _db.ConfiguracoesSistema.AsNoTracking().FirstOrDefaultAsync(c => c.Chave == ChaveAtivo);
        var ativo = await IsAtivoAsync();
        // SQLite devolve a data sem fuso; ela é gravada em UTC
        var alteradoEm = salvo is null ? (DateTime?)null : DateTime.SpecifyKind(salvo.UpdatedAt, DateTimeKind.Utc);
        try
        {
            var instancia = await BuscarInstanciaConectadaAsync();
            return new WhatsAppStatus(ativo, instancia is not null, instancia?.Telefone, instancia?.Id, null, alteradoEm, salvo?.AlteradoPor);
        }
        catch (Exception ex) when (ex is BixsException or InvalidOperationException or HttpRequestException or TaskCanceledException)
        {
            return new WhatsAppStatus(ativo, false, null, null, ex.Message, alteradoEm, salvo?.AlteradoPor);
        }
    }

    /// <summary>
    /// Usa a primeira instância da conta (cria uma se não houver) e devolve o QR Code para escanear,
    /// ou Conectado = true se ela já estiver conectada.
    /// </summary>
    public async Task<WhatsAppConexao> ConectarAsync()
    {
        var instancias = await _bixs.ListWhatsAppInstancesAsync();
        var conectada = await BuscarInstanciaConectadaAsync(instancias);
        if (conectada is not null)
            return new WhatsAppConexao(conectada.Id, true, null);

        var id = instancias.Select(i => i?["id"]?.ToString()).FirstOrDefault(i => !string.IsNullOrEmpty(i))
                 ?? await _bixs.CreateWhatsAppInstanceAsync($"nomelimpo-{Guid.NewGuid().ToString("N")[..6]}");

        var qrCode = await _bixs.GetWhatsAppInstanceQrCodeAsync(id);
        return new WhatsAppConexao(id, false, qrCode);
    }

    /// <summary>
    /// Envia a mensagem se o WhatsApp estiver ligado. Com clienteId, registra o envio na régua de comunicação
    /// (só adiciona ao contexto: quem chama salva).
    /// </summary>
    public async Task<WhatsAppEnvio> EnviarAsync(
        string? telefone,
        string nome,
        string mensagem,
        string? clienteId = null,
        string tipo = "Manual",
        string assunto = "",
        bool automatico = true)
    {
        if (!await IsAtivoAsync())
            return new WhatsAppEnvio(false, "O envio por WhatsApp está desligado.");

        var numero = NumeroWhatsApp(telefone);
        if (numero is null)
            return Registrar(new WhatsAppEnvio(false, "Telefone inválido para WhatsApp."), telefone ?? "", clienteId, tipo, assunto, mensagem);

        if (automatico && !ReservarEnvioAutomatico(numero))
        {
            _logger.LogWarning("WhatsApp para {Telefone} bloqueado pelo limite de envios automáticos.", MascararTelefone(numero));
            return Registrar(new WhatsAppEnvio(false, "Limite de mensagens automáticas atingido. Tente de novo em alguns minutos."),
                numero, clienteId, tipo, assunto, mensagem);
        }

        WhatsAppEnvio resultado;
        try
        {
            var envio = EnviarParaInstanciaAsync(numero, nome, mensagem);
            var terminou = await Task.WhenAny(envio, Task.Delay(TempoMaximoEnvio));
            resultado = terminou == envio
                ? await envio
                : new WhatsAppEnvio(false, "A Bixs demorou demais para responder ao envio do WhatsApp.");
        }
        catch (Exception ex) when (ex is BixsException or InvalidOperationException or HttpRequestException or TaskCanceledException)
        {
            resultado = new WhatsAppEnvio(false, ex.Message);
        }

        if (!resultado.Enviado)
            _logger.LogWarning("WhatsApp para {Telefone} não enviado: {Erro}", MascararTelefone(numero), resultado.Erro);

        return Registrar(resultado, numero, clienteId, tipo, assunto, mensagem);
    }

    private bool ReservarEnvioAutomatico(string numero)
    {
        var limitePorNumero = _config.GetValue("WhatsApp:LimitePorNumero", 6);
        var limiteGeral = _config.GetValue("WhatsApp:LimiteGeral", 40);
        var agora = DateTime.UtcNow;
        lock (EnviosAutomaticos)
        {
            EnviosAutomaticos.RemoveAll(e => agora - e.Em > JanelaLimite);
            if (EnviosAutomaticos.Count >= limiteGeral || EnviosAutomaticos.Count(e => e.Numero == numero) >= limitePorNumero)
                return false;
            EnviosAutomaticos.Add((agora, numero));
            return true;
        }
    }

    private async Task<WhatsAppEnvio> EnviarParaInstanciaAsync(string numero, string nome, string mensagem)
    {
        var instancia = await BuscarInstanciaConectadaAsync();
        if (instancia is null)
            return new WhatsAppEnvio(false, "Nenhum WhatsApp da empresa conectado. Conecte pelo QR Code no backoffice.");

        // Nunca manda para o próprio número conectado
        if (!string.IsNullOrEmpty(instancia.Telefone) && MesmoTelefone(numero, instancia.Telefone))
            return new WhatsAppEnvio(false, "O destino é o próprio número conectado.");

        await _bixs.SendWhatsAppMessageAsync(instancia.Id, numero, nome, mensagem);
        return new WhatsAppEnvio(true, null);
    }

    private WhatsAppEnvio Registrar(WhatsAppEnvio resultado, string destino, string? clienteId, string tipo, string assunto, string mensagem)
    {
        if (string.IsNullOrEmpty(clienteId))
            return resultado;

        _db.LogsComunicacao.Add(new LogComunicacao
        {
            Id = "log_" + Guid.NewGuid().ToString("N")[..12],
            ClienteId = clienteId,
            Tipo = tipo,
            Canal = "WhatsApp",
            Destinatario = destino,
            Assunto = assunto,
            // O código de verificação não fica no histórico
            Conteudo = tipo == "TokenValidacao" ? "Código de verificação enviado." : mensagem,
            Status = resultado.Enviado ? "Enviado" : "Falha",
            DataEnvio = DateTime.UtcNow
        });
        return resultado;
    }

    private sealed record Instancia(string Id, string? Telefone);

    private async Task<Instancia?> BuscarInstanciaConectadaAsync(JsonArray? instancias = null)
    {
        instancias ??= await _bixs.ListWhatsAppInstancesAsync();

        // Status vem na lista na maioria das vezes; senão consulta um a um
        foreach (var item in instancias)
        {
            var id = item?["id"]?.ToString();
            if (!string.IsNullOrEmpty(id) && EstaConectado(item?["status"]?.ToString()))
                return new Instancia(id, item?["phone_number"]?.ToString());
        }

        foreach (var item in instancias)
        {
            var id = item?["id"]?.ToString();
            if (string.IsNullOrEmpty(id))
                continue;
            if (EstaConectado(await _bixs.GetWhatsAppInstanceStatusAsync(id)))
                return new Instancia(id, item?["phone_number"]?.ToString());
        }

        return null;
    }

    private static bool EstaConectado(string? status) =>
        status?.Trim().ToUpperInvariant() is "OPEN" or "CONNECTED";

    // --- Telefone ---

    /// <summary>
    /// Celular/fixo brasileiro (DDD + número, com ou sem 55) no formato da Bixs: só dígitos com 55 na frente.
    /// Mesmas regras do Contratos: 10 ou 11 dígitos, DDD 11–99, celular começa com 9, sem dígitos todos iguais.
    /// </summary>
    public static string? NumeroWhatsApp(string? telefone)
    {
        var digitos = Regex.Replace(telefone ?? "", @"\D", "");
        if (digitos.StartsWith("55") && digitos.Length is 12 or 13)
            digitos = digitos[2..];

        if (digitos.Length is not (10 or 11))
            return null;
        if (!int.TryParse(digitos[..2], out var ddd) || ddd < 11 || ddd > 99)
            return null;
        if (digitos.Length == 11 && digitos[2] != '9')
            return null;
        if (Regex.IsMatch(digitos, @"^(\d)\1+$"))
            return null;

        return "55" + digitos;
    }

    public static string MascararTelefone(string? telefone)
    {
        var digitos = Regex.Replace(telefone ?? "", @"\D", "");
        if (digitos.StartsWith("55") && digitos.Length > 11)
            digitos = digitos[2..];
        return digitos.Length < 6 ? "***" : $"({digitos[..2]}) *****-{digitos[^4..]}";
    }

    private static bool MesmoTelefone(string a, string b)
    {
        static string Local(string t)
        {
            var d = Regex.Replace(t, @"\D", "");
            return d.StartsWith("55") && d.Length > 11 ? d[2..] : d;
        }
        var la = Local(a);
        var lb = Local(b);
        return la.Length > 0 && lb.Length > 0 && (la == lb || la.EndsWith(lb) || lb.EndsWith(la));
    }

    // --- Mensagens ---

    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    public static string MensagemCodigo(string codigo) =>
        $"*Nome Limpo Express*\n\nSeu código de verificação é: *{codigo}*\n\n" +
        "Ele vale por 10 minutos. Não compartilhe este código com ninguém.";

    // O código Pix vai sozinho na mensagem seguinte, para o cliente copiar sem pegar texto junto
    public static string MensagemPix(string nome, decimal valor) =>
        $"*Nome Limpo Express*\n\nOlá, {PrimeiroNome(nome)}! Recebemos seu cadastro.\n\n" +
        $"Para ativar a regularização, pague a 1ª mensalidade de *R$ {valor.ToString("N2", PtBr)}* " +
        "com o Pix Copia e Cola da próxima mensagem (toque e segure para copiar).";

    public static string MensagemPagamentoConfirmado(string nome, string protocolo, DateTime dataPrevista) =>
        $"*Nome Limpo Express*\n\n✅ Pagamento confirmado, {PrimeiroNome(nome)}!\n\n" +
        $"Seu processo de regularização já começou.\nProtocolo: *{protocolo}*\n" +
        $"Previsão de conclusão: {dataPrevista.ToString("dd/MM/yyyy", PtBr)}\n\n" +
        "Acompanhe pela Área do Cliente no nosso site, com o seu CPF/CNPJ.";

    private static string PrimeiroNome(string nome)
    {
        var primeiro = (nome ?? "").Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return string.IsNullOrEmpty(primeiro) ? "cliente" : primeiro;
    }
}
