using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Contracts;
using Todomotriz.Api.Models;
using Todomotriz.Api.Security;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
    public async Task<ActionResult<Invoice>> GetById(Guid id) => Ok(await _service.GetByIdAsync(id));

    /// <summary>Crea la factura (pendiente) y descuenta el stock. Todos los roles pueden facturar.</summary>
    [HttpPost]
    public async Task<ActionResult<Invoice>> Create([FromBody] InvoiceSaveRequest request)
    {
        var created = await _service.CreateAsync(request, User.UserName());
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Modifica datos y productos de una factura pendiente, ajustando el stock.</summary>
    [Authorize(Roles = Roles.Gestion)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] InvoiceSaveRequest request)
    {
        await _service.UpdateAsync(id, request);
        return NoContent();
    }

    /// <summary>Registra el pago o anula una factura pendiente (anular devuelve el stock).</summary>
    [Authorize(Roles = Roles.Gestion)]
    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] InvoiceStatusRequest request)
    {
        await _service.ChangeStatusAsync(id, request.Estado);
        return NoContent();
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
