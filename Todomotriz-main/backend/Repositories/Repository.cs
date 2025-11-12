using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;

namespace Todomotriz.Api.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _db;

    public Repository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<T>> GetAllAsync()
    {
        return await _db.Set<T>().ToListAsync();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _db.Set<T>().FindAsync(id);
    }

    public async Task<T> AddAsync(T entity)
    {
        _db.Set<T>().Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        _db.Set<T>().Update(entity);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity == null) return;
        _db.Set<T>().Remove(entity);
        await _db.SaveChangesAsync();
    }
}
