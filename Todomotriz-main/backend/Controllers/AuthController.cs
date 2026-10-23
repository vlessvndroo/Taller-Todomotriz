using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Contracts;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserService _users;

    public AuthController(IUserService users)
    {
        _users = users;
    }

    /// <summary>Valida credenciales y devuelve los datos del usuario con su token JWT.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request) =>
        Ok(await _users.LoginAsync(request));
}
