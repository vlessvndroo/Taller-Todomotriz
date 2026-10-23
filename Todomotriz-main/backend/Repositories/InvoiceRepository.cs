using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetWithItemsAsync(Guid id);
    Task UpdateWithItemsAsync(Invoice invoice, List<InvoiceItem>? replacementItems);
}

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(AppDbContext db) : base(db) { }

    public async Task<Invoice?> GetWithItemsAsync(Guid id)
    {
        return await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
    }

    // La factura debe venir cargada con GetWithItemsAsync (entidad rastreada por EF).
    // Los items se reemplazan borrando los anteriores e insertando copias con Id nuevo.
    public async Task UpdateWithItemsAsync(Invoice invoice, List<InvoiceItem>? replacementItems)
    {
        if (replacementItems != null)
        {
            _db.InvoiceItems.RemoveRange(invoice.Items);
            invoice.Items = replacementItems.Select(it => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                ProductoId = it.ProductoId,
                Producto = it.Producto,
                Cantidad = it.Cantidad,
                PrecioUnitario = it.PrecioUnitario,
                Subtotal = it.Subtotal,
            }).ToList();
            _db.InvoiceItems.AddRange(invoice.Items);
        }
        await _db.SaveChangesAsync();
    }
}
