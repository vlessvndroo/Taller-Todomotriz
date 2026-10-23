using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface IProductRepository : IRepository<Product>
{
    Task<List<Product>> SearchByNameAsync(string term);
    Task<bool> CodigoExistsAsync(string codigo, Guid? excludeId = null);
    Task<int> CountPendingInvoicesAsync(Guid productId);
    Task<int> CountBySupplierAsync(Guid supplierId);
    Task RenameSupplierAsync(Guid supplierId, string nombre);
}

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext db) : base(db) { }

    public async Task<List<Product>> SearchByNameAsync(string term)
    {
        return await _db.Products
            .Where(p => p.Nombre.Contains(term))
            .ToListAsync();
    }

    public Task<bool> CodigoExistsAsync(string codigo, Guid? excludeId = null)
    {
        var normalized = codigo.Trim().ToLower();
        return _db.Products.AnyAsync(p => p.Codigo.ToLower() == normalized && p.Id != excludeId);
    }

    public Task<int> CountPendingInvoicesAsync(Guid productId) =>
        _db.Invoices.CountAsync(i => i.Estado == "pendiente" && i.Items.Any(it => it.ProductoId == productId));

    public Task<int> CountBySupplierAsync(Guid supplierId) =>
        _db.Products.CountAsync(p => p.ProveedorId == supplierId);

    public async Task RenameSupplierAsync(Guid supplierId, string nombre)
    {
        var productos = await _db.Products.Where(p => p.ProveedorId == supplierId).ToListAsync();
        foreach (var p in productos) p.Proveedor = nombre;
        await _db.SaveChangesAsync();
    }
}
