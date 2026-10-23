using Todomotriz.Api.Contracts;

namespace Todomotriz.Api.Services;

public interface IUserService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<List<UserDto>> GetAllAsync();
    Task<UserDto> GetByIdAsync(Guid id);
    Task<UserDto> CreateAsync(UserSaveRequest request);
    Task UpdateAsync(Guid id, UserSaveRequest request, Guid currentUserId);
    Task DeleteAsync(Guid id, Guid currentUserId);
}
