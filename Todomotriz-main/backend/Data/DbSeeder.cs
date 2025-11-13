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
            new User { Id = Guid.NewGuid(), Nombre = "Ana Torres", Email = "ana@taller.com", Rol = "empleado", Activo = true, Telefono = "0966666666", CreatedAt = DateTime.Parse("2024-02-01") }
        };

        await context.Users.AddRangeAsync(users);

        // Seed Suppliers
        var suppliers = new List<Supplier>
        {
            new Supplier { Id = Guid.NewGuid(), Nombre = "AutoPartes de Caracas S.A.", RIF = "1792345678001", Contacto = "María González", Telefono = "0991234567", Email = "contacto@autopartes.com", Direccion = "Av. Principal 123", Ciudad = "Quito", Activo = true, CreatedAt = DateTime.Parse("2024-01-15") },
            new Supplier { Id = Guid.NewGuid(), Nombre = "Repuestos Automotrices CIA LTDA", RIF = "1798765432001", Contacto = "Pedro Martínez", Telefono = "0987654321", Email = "ventas@repuestosautomotrices.com", Direccion = "Calle Secundaria 456", Ciudad = "Guayaquil", Activo = true, CreatedAt = DateTime.Parse("2024-02-01") },
            new Supplier { Id = Guid.NewGuid(), Nombre = "Importadora de Lubricantes", RIF = "1791122334001", Contacto = "Ana Silva", Telefono = "0993344556", Email = "info@lubricantes.com", Direccion = "Parque Industrial Norte", Ciudad = "Cuenca", Activo = true, CreatedAt = DateTime.Parse("2024-01-20") }
        };

        await context.Suppliers.AddRangeAsync(suppliers);

        // Seed Products (map product old id strings to new GUIDs)
        var productIdMap = new Dictionary<string, Guid>();

        var products = new List<Product>();

        void AddProduct(string oldId, string codigo, string nombre, string descripcion, string categoria, int cantidad, decimal precioCompra, decimal precioVenta, int stockMinimo, string proveedor, string ubicacion, string ultimaActualizacion)
        {
            var gid = Guid.NewGuid();
            productIdMap[oldId] = gid;
            products.Add(new Product
            {
                Id = gid,
                Codigo = codigo,
                Nombre = nombre,
                Descripcion = descripcion,
                Categoria = categoria,
                Cantidad = cantidad,
                PrecioCompra = precioCompra,
                PrecioVenta = precioVenta,
                StockMinimo = stockMinimo,
                Proveedor = proveedor,
                Ubicacion = ubicacion,
                UltimaActualizacion = DateTime.Parse(ultimaActualizacion)
            });
        }

        AddProduct("1", "FIL-001", "Filtro de Aceite", "Filtro de aceite universal para motores de 4 cilindros", "Filtros", 45, 8.50m, 15.00m, 20, "AutoPartes del Ecuador S.A.", "Estante A-12", "2024-10-10");
        AddProduct("2", "ACE-001", "Aceite de Motor 20W-50", "Aceite mineral para motor, presentación de 4 litros", "Lubricantes", 30, 22.00m, 35.00m, 15, "Importadora de Lubricantes", "Bodega B-5", "2024-10-12");
        AddProduct("3", "FRE-001", "Pastillas de Freno Delanteras", "Pastillas de freno cerámicas para vehículos ligeros", "Frenos", 18, 35.00m, 55.00m, 10, "Repuestos Automotrices CIA LTDA", "Estante C-8", "2024-10-08");
        AddProduct("4", "BAT-001", "Batería 12V 45AH", "Batería libre de mantenimiento", "Baterías", 8, 85.00m, 130.00m, 5, "AutoPartes del Ecuador S.A.", "Bodega D-1", "2024-10-14");
        AddProduct("5", "LLA-001", "Juego de Llantas 185/65R15", "Set de 4 llantas radiales para auto", "Llantas", 12, 180.00m, 280.00m, 8, "Repuestos Automotrices CIA LTDA", "Patio Exterior", "2024-10-11");

        await context.Products.AddRangeAsync(products);

        // Seed Invoices
        var invoices = new List<Invoice>();

        InvoiceItem MakeItem(string oldProductId, string productoNombre, int cantidad, decimal precioUnitario)
        {
            return new InvoiceItem
            {
                Id = Guid.NewGuid(),
                ProductoId = productIdMap.ContainsKey(oldProductId) ? productIdMap[oldProductId] : Guid.Empty,
                Producto = productoNombre,
                Cantidad = cantidad,
                PrecioUnitario = precioUnitario,
                Subtotal = cantidad * precioUnitario
            };
        }

        var inv1 = new Invoice
        {
            Id = Guid.NewGuid(),
            NumeroFactura = "FAC-2024-001",
            Fecha = DateTime.Parse("2024-10-10T10:30:00"),
            Cliente = "Roberto Pérez",
            ClienteCedula = "1712345678001",
            Vehiculo = "Toyota Corolla 2018",
            Placa = "ABC-1234",
            Subtotal = 50.00m,
            Iva = 6.00m,
            Total = 56.00m,
            Estado = "pagada",
            MetodoPago = "Efectivo",
            Observaciones = "Cambio de aceite y filtro",
            CreadoPor = "Carlos Empleado",
        };
        inv1.Items.Add(MakeItem("1", "Filtro de Aceite", 1, 15.00m));
        inv1.Items.Add(MakeItem("2", "Aceite de Motor 20W-50", 1, 35.00m));

        var inv2 = new Invoice
        {
            Id = Guid.NewGuid(),
            NumeroFactura = "FAC-2024-002",
            Fecha = DateTime.Parse("2024-10-11T14:15:00"),
            Cliente = "María López",
            ClienteCedula = "1798765432001",
            Vehiculo = "Chevrolet Aveo 2020",
            Placa = "XYZ-5678",
            Subtotal = 55.00m,
            Iva = 6.60m,
            Total = 61.60m,
            Estado = "pagada",
            MetodoPago = "Tarjeta",
            Observaciones = "Cambio de pastillas delanteras",
            CreadoPor = "Carlos Empleado",
        };
        inv2.Items.Add(MakeItem("3", "Pastillas de Freno Delanteras", 1, 55.00m));

        var inv3 = new Invoice
        {
            Id = Guid.NewGuid(),
            NumeroFactura = "FAC-2024-003",
            Fecha = DateTime.Parse("2024-10-12T09:00:00"),
            Cliente = "Luis Ramírez",
            ClienteCedula = "1723456789001",
            Vehiculo = "Hyundai Accent 2019",
            Placa = "DEF-9012",
            Subtotal = 130.00m,
            Iva = 15.60m,
            Total = 145.60m,
            Estado = "pendiente",
            MetodoPago = "Transferencia",
            Observaciones = "Instalación de batería incluida",
            CreadoPor = "Juan Gerente",
        };
        inv3.Items.Add(MakeItem("4", "Batería 12V 45AH", 1, 130.00m));

        invoices.Add(inv1);
        invoices.Add(inv2);
        invoices.Add(inv3);

        await context.Invoices.AddRangeAsync(invoices);

        await context.SaveChangesAsync();
    }
}
