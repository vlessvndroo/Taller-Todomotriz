using Todomotriz.Api.Contracts;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Services;

public interface IInvoiceService
{
    Task<List<Invoice>> GetAllAsync();
    Task<Invoice> GetByIdAsync(Guid id);
    Task<Invoice> CreateAsync(InvoiceSaveRequest request, string creadoPor);
    Task UpdateAsync(Guid id, InvoiceSaveRequest request);
    Task ChangeStatusAsync(Guid id, string estado);
    Task DeleteAsync(Guid id);
}
