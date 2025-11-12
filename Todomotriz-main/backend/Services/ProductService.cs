using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;

namespace Todomotriz.Api.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repo;

    public ProductService(IProductRepository repo)
    {
        _repo = repo;
    }

    public Task<List<Product>> GetAllAsync() => _repo.GetAllAsync();

    public Task<Product?> GetByIdAsync(Guid id) => _repo.GetByIdAsync(id);

    public Task<Product> CreateAsync(Product product)
    {
        product.Id = Guid.NewGuid();
        product.UltimaActualizacion = DateTime.UtcNow;
        return _repo.AddAsync(product);
    }

    public Task UpdateAsync(Product product)
    {
        product.UltimaActualizacion = DateTime.UtcNow;
        return _repo.UpdateAsync(product);
    }

    public Task DeleteAsync(Guid id) => _repo.DeleteAsync(id);

    public Task<List<Product>> SearchAsync(string term) => _repo.SearchByNameAsync(term);
}
