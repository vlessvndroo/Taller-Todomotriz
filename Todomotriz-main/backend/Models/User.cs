using System.ComponentModel.DataAnnotations;

namespace Todomotriz.Api.Models;

public class User
{
    [Key]
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Email { get; set; } = null!;
    /// <summary>Hash de la contraseña (PasswordHasher de ASP.NET Core), nunca el texto plano</summary>
    public string Password { get; set; } = string.Empty;
    public string Rol { get; set; } = "empleado";
    public bool Activo { get; set; } = true;
    public string? Telefono { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}