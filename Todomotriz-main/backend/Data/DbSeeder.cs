using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // If any data exists, skip seeding
        if (await context.Users.AnyAsync() || await context.Products.AnyAsync() || await context.Suppliers.AnyAsync() || await context.Invoices.AnyAsync())
            return;

        // Seed Users (from frontend mock)
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), Nombre = "Admin Principal", Email = "admin@taller.com", Rol = "admin", Activo = true, Telefono = "0999999999", CreatedAt = DateTime.Parse("2024-01-01") },
            new User { Id = Guid.NewGuid(), Nombre = "Juan Gerente", Email = "gerente@taller.com", Rol = "gerente", Activo = true, Telefono = "0988888888", CreatedAt = DateTime.Parse("2024-01-01") },
            new User { Id = Guid.NewGuid(), Nombre = "Carlos Empleado", Email = "empleado@taller.com", Rol = "empleado", Activo = true, Telefono = "0977777777", CreatedAt = DateTime.Parse("2024-01-15") },
        };
        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();

        // Seed Suppliers
        var suppliers = new List<Supplier>
        {
            new Supplier { Id = Guid.NewGuid(), Nombre = "Repuestos Caracas C.A.", RIF = "J-12345678", Contacto = "Pedro Pérez", Telefono = "0212-5551111", Email = "ventas@repuestosccs.com", Direccion = "Av. Principal", Ciudad = "Caracas", Activo = true },
            new Supplier { Id = Guid.NewGuid(), Nombre = "Aceites y Filtros S.A.", RIF = "J-87654321", Contacto = "Maria Gomez", Telefono = "0414-9998888", Email = "contacto@aceites.com", Direccion = "Zona Industrial", Ciudad = "Valencia", Activo = true }
        };
        await context.Suppliers.AddRangeAsync(suppliers);
        await context.SaveChangesAsync();

        // Seed Products (map product old id strings to new GUIDs)
        var products = new List<Product>
        {
            new Product { Id = Guid.NewGuid(), Codigo = "ACE-001", Nombre = "Aceite 20W50 Mineral", Descripcion = "Aceite de motor 1L", Categoria = "Lubricantes", Cantidad = 50, PrecioCompra = 5.00m, PrecioVenta = 8.50m, StockMinimo = 10, Proveedor = "Aceites y Filtros S.A.", Ubicacion = "Estante A1" },
            new Product { Id = Guid.NewGuid(), Codigo = "FIL-001", Nombre = "Filtro de Aceite Universal", Descripcion = "Rosca estándar", Categoria = "Filtros", Cantidad = 30, PrecioCompra = 2.50m, PrecioVenta = 5.00m, StockMinimo = 5, Proveedor = "Aceites y Filtros S.A.", Ubicacion = "Estante A2" },
            new Product { Id = Guid.NewGuid(), Codigo = "PAS-001", Nombre = "Pastillas de Freno Delanteras", Descripcion = "Cerámica", Categoria = "Frenos", Cantidad = 15, PrecioCompra = 20.00m, PrecioVenta = 35.00m, StockMinimo = 4, Proveedor = "Repuestos Caracas C.A.", Ubicacion = "Pasillo B" }
        };
        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();

        // Seed Invoices
        var inv1 = new Invoice
        {
            Id = Guid.NewGuid(),
            NumeroFactura = "FAC-2025-001",
            Fecha = DateTime.Parse("2025-10-10T10:00:00"),
            Cliente = "Josefa Mendez",
            ClienteCedula = "V-12345678",
            Vehiculo = "Ford Fiesta",
            Placa = "ABC-123",
            Subtotal = 17.00m,
            Iva = 2.72m,
            Total = 19.72m,
            Estado = "pagada",
            MetodoPago = "Efectivo",
            CreadoPor = "Juan Gerente"
        };
        inv1.Items.Add(new InvoiceItem { Id = Guid.NewGuid(), InvoiceId = inv1.Id, Producto = "Aceite 20W50 Mineral", Cantidad = 2, PrecioUnitario = 8.50m, Subtotal = 17.00m, ProductoId = products[0].Id });

        await context.Invoices.AddAsync(inv1);
        await context.SaveChangesAsync();
    }
}
