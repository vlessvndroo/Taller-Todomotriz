using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email, Guid? excludeId = null);
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext db) : base(db) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLower();
        return await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
    }

    public Task<bool> EmailExistsAsync(string email, Guid? excludeId = null)
    {
        var normalized = email.Trim().ToLower();
        return _db.Users.AnyAsync(u => u.Email.ToLower() == normalized && u.Id != excludeId);
    }
}
