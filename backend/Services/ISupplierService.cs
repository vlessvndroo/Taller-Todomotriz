using Todomotriz.Api.Models;

namespace Todomotriz.Api.Services;

public interface ISupplierService
{
    Task<List<Supplier>> GetAllAsync();
    Task<Supplier> GetByIdAsync(Guid id);
    Task<Supplier> CreateAsync(Supplier input);
    Task UpdateAsync(Guid id, Supplier input);
    Task DeleteAsync(Guid id);
}
