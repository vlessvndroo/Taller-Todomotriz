using Todomotriz.Api.Models;

namespace Todomotriz.Api.Contracts;

/// <summary>Usuario tal como se expone en la API: nunca incluye la contraseña.</summary>
public record UserDto(Guid Id, string Nombre, string Email, string Rol, bool Activo, string? Telefono, DateTime CreatedAt)
{
    public static UserDto From(User u) => new(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.Telefono, u.CreatedAt);
}

public class UserSaveRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = "empleado";
    public bool Activo { get; set; } = true;
    public string? Telefono { get; set; }

    /// <summary>Obligatoria al crear. Al editar, vacía = no se cambia.</summary>
    public string? Password { get; set; }
}
