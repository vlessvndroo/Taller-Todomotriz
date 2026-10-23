namespace Todomotriz.Api.Security;

/// <summary>
/// Roles del sistema. Deben coincidir con la matriz de permisos del frontend
/// (frontend/src/contexts/AuthContext.tsx).
/// </summary>
public static class Roles
{
    public const string Admin = "admin";
    public const string Gerente = "gerente";
    public const string Empleado = "empleado";

    /// <summary>Para [Authorize(Roles = ...)]: administrador y gerente</summary>
    public const string Gestion = Admin + "," + Gerente;

    public static readonly string[] Todos = { Admin, Gerente, Empleado };
}
