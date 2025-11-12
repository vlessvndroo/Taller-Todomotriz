using System.ComponentModel.DataAnnotations;

namespace Todomotriz.Api.Models;

public class Product
{
    [Key]
    public Guid Id { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string? Categoria { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioCompra { get; set; }
    public decimal PrecioVenta { get; set; }
    public int StockMinimo { get; set; }
    public string? Proveedor { get; set; }
    public string? Ubicacion { get; set; }
    public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
}
