using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface ISupplierRepository : IRepository<Supplier>
{
    Task<bool> RifExistsAsync(string rif, Guid? excludeId = null);
}

public class SupplierRepository : Repository<Supplier>, ISupplierRepository
{
    public SupplierRepository(AppDbContext db) : base(db) { }

    public Task<bool> RifExistsAsync(string rif, Guid? excludeId = null)
    {
        var normalized = rif.Trim().ToUpper();
        return _db.Suppliers.AnyAsync(s => s.RIF.ToUpper() == normalized && s.Id != excludeId);
    }
}
