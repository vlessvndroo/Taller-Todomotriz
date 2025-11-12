using Todomotriz.Api.Models;

namespace Todomotriz.Api.Services;

public interface IProductService
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product> CreateAsync(Product product);
    Task UpdateAsync(Product product);
    Task DeleteAsync(Guid id);
    Task<List<Product>> SearchAsync(string term);
}
