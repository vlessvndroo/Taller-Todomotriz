using System.ComponentModel.DataAnnotations;

namespace Todomotriz.Api.Models;

public class Supplier
{
    [Key]
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Ruc { get; set; } = null!;
    public string? Contacto { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
