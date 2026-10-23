using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Contracts;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;

namespace Todomotriz.Api.Services;

/// <summary>
/// Facturación. Cada operación modifica factura y stock con un único SaveChanges,
/// así que se guarda todo o nada. Precios, IVA, totales y numeración los calcula el backend.
/// </summary>
public class InvoiceService : IInvoiceService
{
    public const decimal IvaRate = 0.16m;
    public static readonly string[] MetodosPago = { "Efectivo", "Tarjeta", "Transferencia" };

    // Serializa la creación para que dos facturas simultáneas no reciban el mismo número
    private static readonly SemaphoreSlim CreateLock = new(1, 1);

    private readonly AppDbContext _db;
    private readonly IInvoiceRepository _repo;

    public InvoiceService(AppDbContext db, IInvoiceRepository repo)
    {
        _db = db;
        _repo = repo;
    }

    public Task<List<Invoice>> GetAllAsync() => _repo.GetAllAsync();

    public async Task<Invoice> GetByIdAsync(Guid id) =>
        await _repo.GetWithItemsAsync(id) ?? throw BusinessException.NotFound("Factura no encontrada.");

    public async Task<Invoice> CreateAsync(InvoiceSaveRequest request, string creadoPor)
    {
        await CreateLock.WaitAsync();
        try
        {
            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                Fecha = DateTime.UtcNow,
                Estado = "pendiente",
                CreadoPor = creadoPor,
            };
            ApplyHeader(invoice, request);

            var lineas = NormalizeItems(request.Items);
            var productos = await LoadProductsAsync(lineas.Keys);
            foreach (var (productoId, cantidad) in lineas)
            {
                var producto = productos.GetValueOrDefault(productoId)
                    ?? throw new BusinessException("Uno de los productos ya no existe en el inventario.");
                Descontar(producto, cantidad);
                invoice.Items.Add(NewItem(invoice.Id, producto.Id, producto.Nombre, cantidad, producto.PrecioVenta));
            }

            CalcularTotales(invoice);
            invoice.NumeroFactura = await NextNumberAsync();
            _db.Invoices.Add(invoice);
            await _db.SaveChangesAsync();
            return invoice;
        }
        finally
        {
            CreateLock.Release();
        }
    }

    public async Task UpdateAsync(Guid id, InvoiceSaveRequest request)
    {
        var invoice = await GetByIdAsync(id);
        if (invoice.Estado != "pendiente") throw BusinessException.Conflict("Solo se pueden modificar facturas pendientes.");
        ApplyHeader(invoice, request);

        var lineas = NormalizeItems(request.Items);
        var anteriores = invoice.Items
            .GroupBy(i => i.ProductoId)
            .ToDictionary(g => g.Key, g => (Cantidad: g.Sum(i => i.Cantidad), g.First().Producto, g.First().PrecioUnitario));
        var productos = await LoadProductsAsync(lineas.Keys.Union(anteriores.Keys));

        // Se devuelve al stock lo que la factura tenía y se vuelve a descontar lo nuevo
        foreach (var (productoId, anterior) in anteriores)
            if (productos.TryGetValue(productoId, out var p)) p.Cantidad += anterior.Cantidad;

        var items = new List<InvoiceItem>();
        foreach (var (productoId, cantidad) in lineas)
        {
            var tenia = anteriores.TryGetValue(productoId, out var anterior);
            if (!productos.TryGetValue(productoId, out var producto))
            {
                // Producto borrado del inventario: se puede mantener o reducir, no aumentar
                if (!tenia) throw new BusinessException("Uno de los productos ya no existe en el inventario.");
                if (cantidad > anterior.Cantidad)
                    throw new BusinessException($"\"{anterior.Producto}\" ya no está en el inventario: solo puedes mantener o reducir su cantidad.");
                items.Add(NewItem(invoice.Id, productoId, anterior.Producto, cantidad, anterior.PrecioUnitario));
                continue;
            }

            Descontar(producto, cantidad);
            // Las líneas que ya estaban conservan el precio con el que se facturaron
            items.Add(NewItem(invoice.Id, producto.Id, tenia ? anterior.Producto : producto.Nombre, cantidad,
                tenia ? anterior.PrecioUnitario : producto.PrecioVenta));
        }

        _db.InvoiceItems.RemoveRange(invoice.Items);
        invoice.Items = items;
        _db.InvoiceItems.AddRange(items);
        CalcularTotales(invoice);
        await _db.SaveChangesAsync();
    }

    public async Task ChangeStatusAsync(Guid id, string estado)
    {
        estado = (estado ?? string.Empty).Trim().ToLowerInvariant();
        if (estado is not ("pagada" or "anulada")) throw new BusinessException("Estado no válido: debe ser \"pagada\" o \"anulada\".");

        var invoice = await GetByIdAsync(id);
        if (invoice.Estado != "pendiente")
            throw BusinessException.Conflict($"La factura ya está {invoice.Estado}; solo se pueden cobrar o anular facturas pendientes.");

        if (estado == "anulada") await DevolverStockAsync(invoice);
        invoice.Estado = estado;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var invoice = await GetByIdAsync(id);
        if (invoice.Estado != "anulada") await DevolverStockAsync(invoice);
        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync();
    }

    // ---- auxiliares ----

    private static void ApplyHeader(Invoice invoice, InvoiceSaveRequest request)
    {
        invoice.Cliente = Validate.Required(request.Cliente, "El cliente");
        invoice.ClienteCedula = Validate.Documento(request.ClienteCedula, "La cédula / RIF del cliente");
        invoice.Vehiculo = string.IsNullOrWhiteSpace(request.Vehiculo) ? null : request.Vehiculo.Trim();
        invoice.Placa = string.IsNullOrWhiteSpace(request.Placa) ? null : request.Placa.Trim().ToUpperInvariant();
        invoice.Observaciones = string.IsNullOrWhiteSpace(request.Observaciones) ? null : request.Observaciones.Trim();

        var metodo = string.IsNullOrWhiteSpace(request.MetodoPago) ? MetodosPago[0] : request.MetodoPago.Trim();
        invoice.MetodoPago = MetodosPago.FirstOrDefault(m => m.Equals(metodo, StringComparison.OrdinalIgnoreCase))
            ?? throw new BusinessException("Método de pago no válido.");
    }

    /// <summary>Valida las líneas y suma las que repiten producto</summary>
    private static Dictionary<Guid, int> NormalizeItems(List<InvoiceItemRequest>? items)
    {
        if (items == null || items.Count == 0) throw new BusinessException("Agrega al menos un producto.");
        if (items.Any(i => i.ProductoId == Guid.Empty)) throw new BusinessException("Hay una línea sin producto.");
        if (items.Any(i => i.Cantidad <= 0)) throw new BusinessException("La cantidad debe ser mayor a 0.");
        return items.GroupBy(i => i.ProductoId).ToDictionary(g => g.Key, g => g.Sum(i => i.Cantidad));
    }

    private async Task<Dictionary<Guid, Product>> LoadProductsAsync(IEnumerable<Guid> ids)
    {
        var lista = ids.ToList();
        return await _db.Products.Where(p => lista.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
    }

    private static void Descontar(Product producto, int cantidad)
    {
        if (producto.Cantidad < cantidad)
            throw new BusinessException($"No hay suficiente stock de \"{producto.Nombre}\". Disponible: {producto.Cantidad}.");
        producto.Cantidad -= cantidad;
        producto.UltimaActualizacion = DateTime.UtcNow;
    }

    private async Task DevolverStockAsync(Invoice invoice)
    {
        var productos = await LoadProductsAsync(invoice.Items.Select(i => i.ProductoId));
        foreach (var item in invoice.Items)
        {
            if (!productos.TryGetValue(item.ProductoId, out var producto)) continue;
            producto.Cantidad += item.Cantidad;
            producto.UltimaActualizacion = DateTime.UtcNow;
        }
    }

    private static InvoiceItem NewItem(Guid invoiceId, Guid productoId, string nombre, int cantidad, decimal precio) => new()
    {
        Id = Guid.NewGuid(),
        InvoiceId = invoiceId,
        ProductoId = productoId,
        Producto = nombre,
        Cantidad = cantidad,
        PrecioUnitario = precio,
        Subtotal = cantidad * precio,
    };

    private static void CalcularTotales(Invoice invoice)
    {
        invoice.Subtotal = invoice.Items.Sum(i => i.Subtotal);
        invoice.Iva = Math.Round(invoice.Subtotal * IvaRate, 2, MidpointRounding.AwayFromZero);
        invoice.Total = invoice.Subtotal + invoice.Iva;
    }

    /// <summary>FAC-{año}-{correlativo}: el mayor número del año + 1 (ej. FAC-2026-001)</summary>
    private async Task<string> NextNumberAsync()
    {
        var prefijo = $"FAC-{DateTime.Now.Year}-";
        var numeros = await _db.Invoices
            .Where(i => i.NumeroFactura.StartsWith(prefijo))
            .Select(i => i.NumeroFactura)
            .ToListAsync();
        var mayor = numeros
            .Select(n => int.TryParse(n[prefijo.Length..], out var x) ? x : 0)
            .DefaultIfEmpty(0)
            .Max();
        return $"{prefijo}{mayor + 1:D3}";
    }
}
