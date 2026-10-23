using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using NomeLimpo.Api.Dtos;

namespace NomeLimpo.Api.Services;

public interface IBixsService
{
    Task<string> AuthenticateAsync();
    Task<PaymentResponseDto?> CreatePaymentInvoiceAsync(PaymentRequestDto requestData);
    Task<PaymentResponseDto?> GetPaymentInvoiceAsync(string coraInvoiceId);
}

public class BixsService : IBixsService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BixsService> _logger;

    private const string DefaultBixApiBase = "https://api.bixs.com.br";

    private static string? _cachedToken;
    private static DateTime _tokenExpiry = DateTime.MinValue;
    private static readonly object _tokenLock = new();

    public BixsService(HttpClient httpClient, IConfiguration configuration, ILogger<BixsService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        var apiBase = new[] { "Bixs:ApiBase", "BixAPI:ApiBase", "Bix:ApiBase" }
                          .Select(key => _configuration[key])
                          .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))
                      ?? DefaultBixApiBase;
        _httpClient.BaseAddress = new Uri(apiBase.TrimEnd('/') + "/");
    }

    public string GetBixEmail()
    {
        return GetRequiredSetting("Bixs:Email", "BixAPI:Email", "Bix:Email");
    }

    public string GetBixPassword()
    {
        return GetRequiredSetting("Bixs:Password", "BixAPI:Password", "Bix:Password");
    }

    public string GetBixApiKey()
    {
        return GetRequiredSetting("Bixs:ApiKey", "BixAPI:API-Key");
    }

    private string GetRequiredSetting(params string[] keys)
    {
        foreach (var key in keys)
        {
            var value = _configuration[key];
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        throw new InvalidOperationException(
            $"Configuração '{keys[0]}' ausente. Defina via dotnet user-secrets (dev) ou variável de ambiente (ex.: {keys[0].Replace(":", "__")}).");
    }

    private string GetOptionalSetting(string key, string defaultValue)
    {
        var value = _configuration[key];
        return string.IsNullOrWhiteSpace(value) ? defaultValue : value;
    }

    public async Task<string> AuthenticateAsync()
    {
        lock (_tokenLock)
        {
            if (_cachedToken is not null && DateTime.UtcNow < _tokenExpiry)
            {
                return _cachedToken;
            }
        }

        var body = new
        {
            email = GetBixEmail(),
            password = GetBixPassword(),
            mac = GetOptionalSetting("Bixs:Mac", "nomelimpo-app"),
            source = GetOptionalSetting("Bixs:Source", "api_externa"),
        };

        var response = await _httpClient.PostAsync("v1/auth/login",
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));

        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Bixs auth failed: {Status} {Body}", response.StatusCode, content);
            throw new BixsException($"Falha na autenticação Bixs: {response.StatusCode}");
        }

        var json = JsonNode.Parse(content);
        var token = json?["token"]?.GetValue<string>()
            ?? json?["access_token"]?.GetValue<string>();

        if (string.IsNullOrEmpty(token))
        {
            throw new BixsException("Bixs não retornou access token válido no login.");
        }

        lock (_tokenLock)
        {
            _cachedToken = token;
            _tokenExpiry = DateTime.UtcNow.AddMinutes(50);
        }

        return token;
    }

    private HttpRequestMessage CreateAuthRequest(HttpMethod method, string path, string token)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var apiKey = GetBixApiKey();
        if (!string.IsNullOrEmpty(apiKey))
        {
            request.Headers.Add("X-API-Key", apiKey);
        }
        return request;
    }

    public async Task<PaymentResponseDto?> CreatePaymentInvoiceAsync(PaymentRequestDto requestData)
    {
        var token = await AuthenticateAsync();
        var request = CreateAuthRequest(HttpMethod.Post, "v1/api/payment/invoices", token);
        request.Content = new StringContent(
            JsonSerializer.Serialize(requestData),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Erro ao integrar com gateway de pagamento Bixs: {StatusCode} - {Content}", response.StatusCode, content);
            throw new BixsException($"Falha ao gerar cobrança de pagamento ({response.StatusCode}): {content}");
        }

        try
        {
            var paymentResult = JsonSerializer.Deserialize<PaymentResponseDto>(content);
            return paymentResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao desserializar retorno do pagamento Bixs: {Content}", content);
            throw new BixsException("Erro ao processar resposta do gateway de pagamento.");
        }
    }

    public async Task<PaymentResponseDto?> GetPaymentInvoiceAsync(string coraInvoiceId)
    {
        try
        {
            var token = await AuthenticateAsync();
            var request = CreateAuthRequest(HttpMethod.Get, $"v1/api/payment/invoices/{Uri.EscapeDataString(coraInvoiceId)}", token);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<PaymentResponseDto>(content);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao consultar fatura no Bixs: {InvoiceId}", coraInvoiceId);
            return null;
        }
    }
}

public class BixsException : Exception
{
    public BixsException(string message) : base(message) { }
}
