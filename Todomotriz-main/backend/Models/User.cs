using System.ComponentModel.DataAnnotations;

namespace Todomotriz.Api.Models;

public class User
{
    [Key]
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = "password123"; 
    public string Rol { get; set; } = "empleado";
    public bool Activo { get; set; } = true;
    public string? Telefono { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}