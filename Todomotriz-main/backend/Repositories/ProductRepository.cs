using System.Linq;
using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface IProductRepository : IRepository<Product>
{
    Task<List<Product>> SearchByNameAsync(string term);
}

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext db) : base(db) { }

    public async Task<List<Product>> SearchByNameAsync(string term)
    {
        return await _db.Products
            .Where(p => p.Nombre.Contains(term))
            .ToListAsync();
    }
}
