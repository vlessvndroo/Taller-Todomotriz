using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;

namespace Todomotriz.Api.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _repo;

    public InvoiceService(IInvoiceRepository repo)
    {
        _repo = repo;
    }

    public Task<List<Invoice>> GetAllAsync() => _repo.GetAllAsync();

    public Task<Invoice?> GetByIdAsync(Guid id) => _repo.GetWithItemsAsync(id);

    public async Task<Invoice> CreateAsync(Invoice invoice)
    {
        invoice.Id = Guid.NewGuid();
        foreach (var item in invoice.Items)
        {
            item.Id = Guid.NewGuid();
            item.InvoiceId = invoice.Id;
        }
        await _repo.AddAsync(invoice);
        return invoice;
    }

    public Task UpdateAsync(Invoice invoice, List<InvoiceItem>? replacementItems = null)
        => _repo.UpdateWithItemsAsync(invoice, replacementItems);

    public Task DeleteAsync(Guid id) => _repo.DeleteAsync(id);
}
