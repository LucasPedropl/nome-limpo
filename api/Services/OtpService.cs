using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace NomeLimpo.Api.Services;

public enum OtpValidationResult
{
    Valid,
    Invalid,
    Expired
}

/// <summary>
/// Códigos de 6 dígitos enviados por e-mail (checkout e login do cliente).
/// Em memória: vale para uma instância só da API; reiniciar a API invalida os códigos pendentes.
/// </summary>
public class OtpService
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);

    private sealed record Entry(string Code, DateTime ExpiresAt, DateTime IssuedAt, int Attempts);

    private readonly ConcurrentDictionary<string, Entry> _store = new();

    /// <summary>
    /// Gera um código para a chave. Dentro do intervalo de reenvio devolve o código atual com IsNew = false
    /// (quem chama não deve disparar outro e-mail).
    /// </summary>
    public (string Code, DateTime ExpiresAt, bool IsNew) Issue(string key)
    {
        var now = DateTime.UtcNow;
        if (_store.TryGetValue(key, out var current) && current.ExpiresAt > now && now - current.IssuedAt < ResendCooldown)
        {
            return (current.Code, current.ExpiresAt, false);
        }

        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var entry = new Entry(code, now.Add(Lifetime), now, 0);
        _store[key] = entry;
        return (code, entry.ExpiresAt, true);
    }

    /// <summary>
    /// Confere o código e o consome se estiver certo. Depois de 5 erros o código é descartado.
    /// </summary>
    public OtpValidationResult Validate(string key, string code)
    {
        if (!_store.TryGetValue(key, out var entry))
            return OtpValidationResult.Invalid;

        if (DateTime.UtcNow > entry.ExpiresAt)
        {
            _store.TryRemove(key, out _);
            return OtpValidationResult.Expired;
        }

        if (CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(entry.Code),
                System.Text.Encoding.UTF8.GetBytes(code)))
        {
            _store.TryRemove(key, out _);
            return OtpValidationResult.Valid;
        }

        var updated = entry with { Attempts = entry.Attempts + 1 };
        if (updated.Attempts >= MaxAttempts)
            _store.TryRemove(key, out _);
        else
            _store.TryUpdate(key, updated, entry);

        return OtpValidationResult.Invalid;
    }
}
