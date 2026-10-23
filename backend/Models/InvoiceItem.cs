using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Todomotriz.Api.Models;

public class InvoiceItem
{
    [Key]
    public Guid Id { get; set; }

    [ForeignKey("Invoice")]
    public Guid InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public Guid ProductoId { get; set; }
    public string Producto { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
