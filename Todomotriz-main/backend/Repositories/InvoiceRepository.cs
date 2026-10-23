using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetWithItemsAsync(Guid id);
}

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(AppDbContext db) : base(db) { }

    public async Task<Invoice?> GetWithItemsAsync(Guid id)
    {
        return await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
    }
}
