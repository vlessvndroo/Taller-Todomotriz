using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext db) : base(db) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
    }
}
