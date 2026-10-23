using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Security;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _service;

    public ProductsController(IProductService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<Product>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetById(Guid id) => Ok(await _service.GetByIdAsync(id));

    [HttpGet("search")]
    public async Task<ActionResult<List<Product>>> Search([FromQuery] string q) =>
        Ok(await _service.SearchAsync(q ?? string.Empty));

    [Authorize(Roles = Roles.Gestion)]
    [HttpPost]
    public async Task<ActionResult<Product>> Create([FromBody] Product product)
    {
        var created = await _service.CreateAsync(product);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = Roles.Gestion)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Product product)
    {
        await _service.UpdateAsync(id, product);
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
