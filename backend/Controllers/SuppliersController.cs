using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Security;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
    public async Task<ActionResult<Supplier>> GetById(Guid id) => Ok(await _service.GetByIdAsync(id));

    [Authorize(Roles = Roles.Gestion)]
    [HttpPost]
    public async Task<ActionResult<Supplier>> Create([FromBody] Supplier supplier)
    {
        var created = await _service.CreateAsync(supplier);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = Roles.Gestion)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Supplier supplier)
    {
        await _service.UpdateAsync(id, supplier);
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
