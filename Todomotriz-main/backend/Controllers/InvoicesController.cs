using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly IProductService _productService; // <-- Nuevo servicio inyectado

    // Actualizamos el constructor para recibir ambos servicios
    public InvoicesController(IInvoiceService invoiceService, IProductService productService)
    {
        _invoiceService = invoiceService;
        _productService = productService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Invoice>>> GetAll() => Ok(await _invoiceService.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<Invoice>> GetById(Guid id)
    {
        var inv = await _invoiceService.GetByIdAsync(id);
        if (inv == null) return NotFound();
        return Ok(inv);
    }

    [HttpPost]
    public async Task<ActionResult<Invoice>> Create([FromBody] Invoice invoice)
    {
        // 1. Crear la factura normalmente
        var created = await _invoiceService.CreateAsync(invoice);

        // 2. DESCONTAR INVENTARIO
        // Recorremos los items de la factura creada
        foreach (var item in invoice.Items)
        {
            // Buscamos el producto en la BD
            var product = await _productService.GetByIdAsync(item.ProductoId);
            
            if (product != null)
            {
                // Restamos la cantidad
                product.Cantidad -= item.Cantidad;
                
                // (Opcional) Evitar negativos si hubo concurrencia, aunque el frontend ya protege
                if (product.Cantidad < 0) product.Cantidad = 0;

                // Guardamos el producto actualizado
                await _productService.UpdateAsync(product);
            }
        }

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Invoice invoice)
    {
        var existing = await _invoiceService.GetByIdAsync(id);
        if (existing == null) return NotFound();

        // Actualizamos campos principales
        existing.NumeroFactura = invoice.NumeroFactura;
        existing.Fecha = invoice.Fecha;
        existing.Cliente = invoice.Cliente;
        existing.ClienteCedula = invoice.ClienteCedula;
        existing.Vehiculo = invoice.Vehiculo;
        existing.Placa = invoice.Placa;
        existing.Subtotal = invoice.Subtotal;
        existing.Iva = invoice.Iva;
        existing.Total = invoice.Total;
        existing.Estado = invoice.Estado;
        existing.MetodoPago = invoice.MetodoPago;
        existing.Observaciones = invoice.Observaciones;
        existing.CreadoPor = invoice.CreadoPor;

        // Reemplazar items (Cuidado: esto asume que 'invoice' trae la lista completa)
        // Si el frontend manda lista vacía al pagar, esto borraría los items.
        // Por eso en el frontend corregimos para enviar siempre la lista completa.
        if (invoice.Items != null && invoice.Items.Any())
        {
            existing.Items = invoice.Items.Select(it =>
            {
                if (it.Id == Guid.Empty) it.Id = Guid.NewGuid();
                it.InvoiceId = existing.Id;
                return it;
            }).ToList();
        }
        // Nota: Si invoice.Items viene vacío (ej: solo actualizando estado), 
        // idealmente no deberíamos borrar los items existentes.
        // Pero con la corrección del frontend, siempre vendrán.

        await _invoiceService.UpdateAsync(existing);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var existing = await _invoiceService.GetByIdAsync(id);
        if (existing == null) return NotFound();

        await _invoiceService.DeleteAsync(id);
        return NoContent();
    }
}