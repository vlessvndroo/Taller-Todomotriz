using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    public async Task<ActionResult<Product>> GetById(Guid id)
    {
        var p = await _service.GetByIdAsync(id);
        if (p == null) return NotFound();
        return Ok(p);
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<Product>>> Search([FromQuery] string q)
    {
        return Ok(await _service.SearchAsync(q ?? string.Empty));
    }

    [HttpPost]
    public async Task<ActionResult<Product>> Create([FromBody] Product product)
    {
        var created = await _service.CreateAsync(product);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Product product)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null) return NotFound();

        // Map fields
        existing.Codigo = product.Codigo;
        existing.Nombre = product.Nombre;
        existing.Descripcion = product.Descripcion;
        existing.Categoria = product.Categoria;
        existing.Cantidad = product.Cantidad;
        existing.PrecioCompra = product.PrecioCompra;
        existing.PrecioVenta = product.PrecioVenta;
        existing.StockMinimo = product.StockMinimo;
        existing.Proveedor = product.Proveedor;
        existing.Ubicacion = product.Ubicacion;

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
