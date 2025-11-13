using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _service;

    public InvoicesController(IInvoiceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<Invoice>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<Invoice>> GetById(Guid id)
    {
        var inv = await _service.GetByIdAsync(id);
        if (inv == null) return NotFound();
        return Ok(inv);
    }

    [HttpPost]
    public async Task<ActionResult<Invoice>> Create([FromBody] Invoice invoice)
    {
        var created = await _service.CreateAsync(invoice);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Invoice invoice)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null) return NotFound();

        // For simplicity, replace fields and items
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

        // Replace items
        existing.Items = invoice.Items.Select(it =>
        {
            if (it.Id == Guid.Empty) it.Id = Guid.NewGuid();
            it.InvoiceId = existing.Id;
            return it;
        }).ToList();

        await _service.UpdateAsync(existing);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null) return NotFound();
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
