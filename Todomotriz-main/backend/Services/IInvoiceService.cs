using Todomotriz.Api.Models;

namespace Todomotriz.Api.Services;

public interface IInvoiceService
{
    Task<List<Invoice>> GetAllAsync();
    Task<Invoice?> GetByIdAsync(Guid id);
    Task<Invoice> CreateAsync(Invoice invoice);
    Task UpdateAsync(Invoice invoice);
    Task DeleteAsync(Guid id);
}
