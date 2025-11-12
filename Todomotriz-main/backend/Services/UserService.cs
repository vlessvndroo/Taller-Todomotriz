using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;

namespace Todomotriz.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo)
    {
        _repo = repo;
    }

    public Task<List<User>> GetAllAsync() => _repo.GetAllAsync();

    public Task<User?> GetByIdAsync(Guid id) => _repo.GetByIdAsync(id);

    public Task<User> CreateAsync(User user)
    {
        user.Id = Guid.NewGuid();
        user.CreatedAt = DateTime.UtcNow;
        return _repo.AddAsync(user);
    }

    public Task UpdateAsync(User user) => _repo.UpdateAsync(user);

    public Task DeleteAsync(Guid id) => _repo.DeleteAsync(id);
}
