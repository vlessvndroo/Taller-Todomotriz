using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<User>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetById(Guid id)
    {
        var user = await _service.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<User>> Create([FromBody] User user)
    {
        var created = await _service.CreateAsync(user);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] User user)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null) return NotFound();

        // Map updatable fields
        existing.Nombre = user.Nombre;
        existing.Email = user.Email;
        existing.Rol = user.Rol;
        existing.Activo = user.Activo;
        existing.Telefono = user.Telefono;
        // Solo se cambia la contraseña si se envió una nueva
        if (!string.IsNullOrWhiteSpace(user.Password)) existing.Password = user.Password;

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
