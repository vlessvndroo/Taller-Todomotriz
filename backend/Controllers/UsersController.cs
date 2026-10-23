using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Contracts;
using Todomotriz.Api.Security;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    [Authorize(Roles = Roles.Gestion)]
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [Authorize(Roles = Roles.Gestion)]
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id) => Ok(await _service.GetByIdAsync(id));

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] UserSaveRequest request)
    {
        var created = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UserSaveRequest request)
    {
        await _service.UpdateAsync(id, request, User.UserId());
        return NoContent();
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id, User.UserId());
        return NoContent();
    }
}
