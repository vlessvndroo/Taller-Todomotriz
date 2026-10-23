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
    /// <summary>Proveedor asociado (fuente de verdad del vínculo)</summary>
    public Guid? ProveedorId { get; set; }
    /// <summary>Nombre del proveedor, copiado para mostrarlo; se actualiza si el proveedor cambia de nombre</summary>
    public string? Proveedor { get; set; }
    public string? Ubicacion { get; set; }
    public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
}
