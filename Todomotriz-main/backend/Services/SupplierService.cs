using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;

namespace Todomotriz.Api.Services;

public class SupplierService : ISupplierService
{
    private readonly ISupplierRepository _repo;

    public SupplierService(ISupplierRepository repo)
    {
        _repo = repo;
    }

    public Task<List<Supplier>> GetAllAsync() => _repo.GetAllAsync();

    public Task<Supplier?> GetByIdAsync(Guid id) => _repo.GetByIdAsync(id);

    public Task<Supplier> CreateAsync(Supplier s)
    {
        s.Id = Guid.NewGuid();
        s.CreatedAt = DateTime.UtcNow;
        return _repo.AddAsync(s);
    }

    public Task UpdateAsync(Supplier s) => _repo.UpdateAsync(s);

    public Task DeleteAsync(Guid id) => _repo.DeleteAsync(id);
}
