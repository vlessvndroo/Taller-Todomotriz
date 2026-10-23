namespace Todomotriz.Api.Contracts;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public record LoginResponse(Guid Id, string Nombre, string Email, string Rol, string Token);
