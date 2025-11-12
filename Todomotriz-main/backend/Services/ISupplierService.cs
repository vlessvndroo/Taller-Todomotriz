using Todomotriz.Api.Models;

namespace Todomotriz.Api.Services;

public interface ISupplierService
{
    Task<List<Supplier>> GetAllAsync();
    Task<Supplier?> GetByIdAsync(Guid id);
    Task<Supplier> CreateAsync(Supplier s);
    Task UpdateAsync(Supplier s);
    Task DeleteAsync(Guid id);
}
