using System.ComponentModel.DataAnnotations;

namespace Todomotriz.Api.Models;

public class Invoice
{
    [Key]
    public Guid Id { get; set; }
    public string NumeroFactura { get; set; } = null!;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public string Cliente { get; set; } = string.Empty;
    public string? ClienteRuc { get; set; }
    public string? Vehiculo { get; set; }
    public string? Placa { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Iva { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = "pendiente";
    public string? MetodoPago { get; set; }
    public string? Observaciones { get; set; }
    public string? CreadoPor { get; set; }

    public List<InvoiceItem> Items { get; set; } = new();
}
