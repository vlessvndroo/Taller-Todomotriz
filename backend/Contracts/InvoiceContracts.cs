namespace Todomotriz.Api.Contracts;

/// <summary>
/// Datos para crear o editar una factura. El número, la fecha, los precios,
/// el IVA y los totales los calcula el backend.
/// </summary>
public class InvoiceSaveRequest
{
    public string Cliente { get; set; } = string.Empty;
    public string? ClienteCedula { get; set; }
    public string? Vehiculo { get; set; }
    public string? Placa { get; set; }
    public string? MetodoPago { get; set; }
    public string? Observaciones { get; set; }
    public List<InvoiceItemRequest> Items { get; set; } = new();
}

public class InvoiceItemRequest
{
    public Guid ProductoId { get; set; }
    public int Cantidad { get; set; }
}

public class InvoiceStatusRequest
{
    /// <summary>"pagada" o "anulada"</summary>
    public string Estado { get; set; } = string.Empty;
}
