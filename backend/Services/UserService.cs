using Microsoft.AspNetCore.Identity;
using Todomotriz.Api.Contracts;
using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;
using Todomotriz.Api.Security;

namespace Todomotriz.Api.Services;

public class UserService : IUserService
{
    private const int MinPasswordLength = 6;

    private readonly IUserRepository _repo;
    private readonly IPasswordHasher<User> _hasher;
    private readonly TokenService _tokens;

    public UserService(IUserRepository repo, IPasswordHasher<User> hasher, TokenService tokens)
    {
        _repo = repo;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _repo.GetByEmailAsync(request.Email ?? string.Empty);
        if (user == null) throw new BusinessException("Usuario no encontrado.", StatusCodes.Status401Unauthorized);
        if (!user.Activo) throw new BusinessException("Acceso denegado. El usuario está inactivo.", StatusCodes.Status401Unauthorized);

        var result = _hasher.VerifyHashedPassword(user, user.Password, request.Password ?? string.Empty);
        if (result == PasswordVerificationResult.Failed)
            throw new BusinessException("Contraseña incorrecta.", StatusCodes.Status401Unauthorized);

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.Password = _hasher.HashPassword(user, request.Password!);
            await _repo.UpdateAsync(user);
        }

        return new LoginResponse(user.Id, user.Nombre, user.Email, user.Rol, _tokens.CreateToken(user));
    }

    public async Task<List<UserDto>> GetAllAsync() => (await _repo.GetAllAsync()).Select(UserDto.From).ToList();

    public async Task<UserDto> GetByIdAsync(Guid id) => UserDto.From(await FindAsync(id));

    public async Task<UserDto> CreateAsync(UserSaveRequest request)
    {
        var user = new User { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        await ApplyAsync(user, request);

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new BusinessException("La contraseña es obligatoria para nuevos usuarios.");
        SetPassword(user, request.Password);

        await _repo.AddAsync(user);
        return UserDto.From(user);
    }

    public async Task UpdateAsync(Guid id, UserSaveRequest request, Guid currentUserId)
    {
        var user = await FindAsync(id);
        if (id == currentUserId)
        {
            if (!request.Activo) throw BusinessException.Conflict("No puedes desactivar tu propia cuenta.");
            if (!string.Equals(request.Rol, user.Rol, StringComparison.OrdinalIgnoreCase))
                throw BusinessException.Conflict("No puedes cambiar tu propio rol.");
        }

        await ApplyAsync(user, request);
        if (!string.IsNullOrWhiteSpace(request.Password)) SetPassword(user, request.Password);

        await _repo.UpdateAsync(user);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId)
    {
        if (id == currentUserId) throw BusinessException.Conflict("No puedes eliminar tu propia cuenta.");
        await FindAsync(id);
        await _repo.DeleteAsync(id);
    }

    private async Task<User> FindAsync(Guid id) =>
        await _repo.GetByIdAsync(id) ?? throw BusinessException.NotFound("Usuario no encontrado.");

    private async Task ApplyAsync(User user, UserSaveRequest request)
    {
        var email = Validate.Email(request.Email, required: true)!;
        if (await _repo.EmailExistsAsync(email, user.Id))
            throw BusinessException.Conflict($"Ya existe un usuario con el correo {email}.");

        var rol = (request.Rol ?? string.Empty).Trim().ToLowerInvariant();
        if (!Roles.Todos.Contains(rol)) throw new BusinessException("Rol no válido.");

        user.Nombre = Validate.Required(request.Nombre, "El nombre");
        user.Email = email;
        user.Rol = rol;
        user.Activo = request.Activo;
        user.Telefono = Validate.Telefono(request.Telefono);
    }

    private void SetPassword(User user, string password)
    {
        if (password.Trim().Length < MinPasswordLength)
            throw new BusinessException($"La contraseña debe tener al menos {MinPasswordLength} caracteres.");
        user.Password = _hasher.HashPassword(user, password.Trim());
    }
}
