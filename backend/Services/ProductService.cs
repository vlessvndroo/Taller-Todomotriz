using System.Text.RegularExpressions;
using Todomotriz.Api.Models;
using Todomotriz.Api.Repositories;

namespace Todomotriz.Api.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repo;
    private readonly ISupplierRepository _suppliers;

    public ProductService(IProductRepository repo, ISupplierRepository suppliers)
    {
        _repo = repo;
        _suppliers = suppliers;
    }

    public Task<List<Product>> GetAllAsync() => _repo.GetAllAsync();

    public async Task<Product> GetByIdAsync(Guid id) =>
        await _repo.GetByIdAsync(id) ?? throw BusinessException.NotFound("Producto no encontrado.");

    public Task<List<Product>> SearchAsync(string term) => _repo.SearchByNameAsync(term);

    public async Task<Product> CreateAsync(Product input)
    {
        var product = new Product { Id = Guid.NewGuid() };
        await ApplyAsync(product, input);
        return await _repo.AddAsync(product);
    }

    public async Task UpdateAsync(Guid id, Product input)
    {
        var product = await GetByIdAsync(id);
        await ApplyAsync(product, input);
        await _repo.UpdateAsync(product);
    }

    public async Task DeleteAsync(Guid id)
    {
        var product = await GetByIdAsync(id);
        // Las facturas pagadas o anuladas guardan nombre y precio del producto, así que conservan
        // su historial; las pendientes todavía pueden editarse o anularse y necesitan el producto.
        var pendientes = await _repo.CountPendingInvoicesAsync(id);
        if (pendientes > 0)
            throw BusinessException.Conflict(
                $"No se puede eliminar \"{product.Nombre}\": está en {pendientes} factura(s) pendiente(s). Cóbralas o anúlalas primero.");
        await _repo.DeleteAsync(id);
    }

    private async Task ApplyAsync(Product product, Product input)
    {
        var codigo = Validate.Required(input.Codigo, "El código").ToUpperInvariant();
        if (await _repo.CodigoExistsAsync(codigo, product.Id))
            throw BusinessException.Conflict($"Ya existe un producto con el código {codigo}.");

        var nombre = Validate.Required(input.Nombre, "El nombre");
        if (!Regex.IsMatch(nombre, @"\p{L}"))
            throw new BusinessException("El nombre debe contener letras (no puede ser solo números).");

        Validate.NotNegative(input.Cantidad, "La cantidad");
        Validate.NotNegative(input.PrecioCompra, "El precio de compra");
        Validate.NotNegative(input.PrecioVenta, "El precio de venta");
        Validate.NotNegative(input.StockMinimo, "El stock mínimo");

        Supplier? proveedor = null;
        if (input.ProveedorId is Guid proveedorId)
            proveedor = await _suppliers.GetByIdAsync(proveedorId) ?? throw new BusinessException("El proveedor seleccionado no existe.");

        product.Codigo = codigo;
        product.Nombre = nombre;
        product.Descripcion = string.IsNullOrWhiteSpace(input.Descripcion) ? null : input.Descripcion.Trim();
        product.Categoria = string.IsNullOrWhiteSpace(input.Categoria) ? null : input.Categoria.Trim();
        product.Cantidad = input.Cantidad;
        product.PrecioCompra = input.PrecioCompra;
        product.PrecioVenta = input.PrecioVenta;
        product.StockMinimo = input.StockMinimo;
        product.ProveedorId = proveedor?.Id;
        product.Proveedor = proveedor?.Nombre;
        product.Ubicacion = string.IsNullOrWhiteSpace(input.Ubicacion) ? null : input.Ubicacion.Trim();
        product.UltimaActualizacion = DateTime.UtcNow;
    }
}
