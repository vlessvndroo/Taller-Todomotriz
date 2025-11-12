using Todomotriz.Api.Data;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Repositories;

public interface ISupplierRepository : IRepository<Supplier>
{
}

public class SupplierRepository : Repository<Supplier>, ISupplierRepository
{
    public SupplierRepository(AppDbContext db) : base(db) { }
}
