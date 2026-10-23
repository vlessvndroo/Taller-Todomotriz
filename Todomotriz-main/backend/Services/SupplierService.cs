using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;

namespace Todomotriz.Api.Services;

public class SupplierService : ISupplierService
{
    private readonly ISupplierRepository _repo;
    private readonly IProductRepository _products;

    public SupplierService(ISupplierRepository repo, IProductRepository products)
    {
        _repo = repo;
        _products = products;
    }

    public Task<List<Supplier>> GetAllAsync() => _repo.GetAllAsync();

    public async Task<Supplier> GetByIdAsync(Guid id) =>
        await _repo.GetByIdAsync(id) ?? throw BusinessException.NotFound("Proveedor no encontrado.");

    public async Task<Supplier> CreateAsync(Supplier input)
    {
        var supplier = new Supplier { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
        await ApplyAsync(supplier, input);
        return await _repo.AddAsync(supplier);
    }

    public async Task UpdateAsync(Guid id, Supplier input)
    {
        var supplier = await GetByIdAsync(id);
        var nombreAnterior = supplier.Nombre;
        await ApplyAsync(supplier, input);
        await _repo.UpdateAsync(supplier);

        // Los productos guardan una copia del nombre para mostrarlo: se mantiene al día
        if (nombreAnterior != supplier.Nombre) await _products.RenameSupplierAsync(id, supplier.Nombre);
    }

    public async Task DeleteAsync(Guid id)
    {
        var supplier = await GetByIdAsync(id);
        var productos = await _products.CountBySupplierAsync(id);
        if (productos > 0)
            throw BusinessException.Conflict(
                $"No se puede eliminar \"{supplier.Nombre}\": tiene {productos} producto(s) asociados. Márcalo como inactivo o cambia el proveedor de esos productos.");
        await _repo.DeleteAsync(id);
    }

    private async Task ApplyAsync(Supplier supplier, Supplier input)
    {
        var rif = Validate.Documento(input.RIF, "El RIF");
        if (await _repo.RifExistsAsync(rif, supplier.Id))
            throw BusinessException.Conflict($"Ya existe un proveedor con el RIF {rif}.");

        supplier.Nombre = Validate.Required(input.Nombre, "La razón social");
        supplier.RIF = rif;
        supplier.Contacto = string.IsNullOrWhiteSpace(input.Contacto) ? null : input.Contacto.Trim();
        supplier.Telefono = Validate.Telefono(input.Telefono);
        supplier.Email = Validate.Email(input.Email);
        supplier.Direccion = string.IsNullOrWhiteSpace(input.Direccion) ? null : input.Direccion.Trim();
        supplier.Ciudad = string.IsNullOrWhiteSpace(input.Ciudad) ? null : input.Ciudad.Trim();
        supplier.Activo = input.Activo;
    }
}
