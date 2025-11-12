using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _service;

    public SuppliersController(ISupplierService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<Supplier>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<Supplier>> GetById(Guid id)
    {
        var s = await _service.GetByIdAsync(id);
        if (s == null) return NotFound();
        return Ok(s);
    }

    [HttpPost]
    public async Task<ActionResult<Supplier>> Create([FromBody] Supplier supplier)
    {
        var created = await _service.CreateAsync(supplier);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Supplier supplier)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null) return NotFound();

        existing.Nombre = supplier.Nombre;
        existing.Ruc = supplier.Ruc;
        existing.Contacto = supplier.Contacto;
        existing.Telefono = supplier.Telefono;
        existing.Email = supplier.Email;
        existing.Direccion = supplier.Direccion;
        existing.Ciudad = supplier.Ciudad;
        existing.Activo = supplier.Activo;

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
