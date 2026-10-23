namespace NomeLimpo.Api.Services;

public static class AuthPolicies
{
    // Usuários do backoffice (UsuarioAdmin.Perfil); clientes recebem a role "Cliente" e ficam de fora
    public const string Backoffice = "Backoffice";
    public static readonly string[] BackofficeRoles = { "Admin", "Operador" };
}
