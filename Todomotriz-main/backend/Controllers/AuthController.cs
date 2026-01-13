using Microsoft.AspNetCore.Mvc;
using Todomotriz.Api.Models;
using Todomotriz.Api.Services;

namespace Todomotriz.Api.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login([FromBody] LoginRequest request)
        {
            var users = await _userService.GetAllAsync();
            
            // Buscar usuario
            var user = users.FirstOrDefault(u => u.Email.ToLower().Trim() == request.Email.ToLower().Trim());

            if (user == null) return Unauthorized(new { message = "Usuario no encontrado." });
            if (!user.Activo) return Unauthorized(new { message = "Acceso denegado. El usuario está inactivo." });

            // VALIDACIÓN REAL DE CONTRASEÑA
            // Comparamos lo que envía el usuario con lo que está en la BD
            if (user.Password != request.Password) 
            {
                return Unauthorized(new { message = "Contraseña incorrecta." });
            }

            return Ok(new
            {
                id = user.Id,
                nombre = user.Nombre,
                email = user.Email,
                rol = user.Rol,
                token = "fake-jwt-" + Guid.NewGuid()
            });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}