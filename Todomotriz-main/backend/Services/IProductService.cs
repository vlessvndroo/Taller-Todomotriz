using Todomotriz.Api.Models;

namespace Todomotriz.Api.Services;

public interface IProductService
{
    Task<List<Product>> GetAllAsync();
    Task<Product> GetByIdAsync(Guid id);
    Task<List<Product>> SearchAsync(string term);
    Task<Product> CreateAsync(Product input);
    Task UpdateAsync(Guid id, Product input);
    Task DeleteAsync(Guid id);
}
