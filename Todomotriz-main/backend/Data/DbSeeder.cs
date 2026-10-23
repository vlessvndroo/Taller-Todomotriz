using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Contracts;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Data;

/// <summary>
/// Precarga una base vacía. Si existe Data/seed-data.json (generado con
/// "dotnet run -- --export-seed") usa esos datos; si no, unos datos de ejemplo.
/// Todos los usuarios precargados entran con la contraseña DefaultPassword.
/// </summary>
public static class DbSeeder
{
    public const string DefaultPassword = "password123";
    public const string SeedFileName = "seed-data.json";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public class SeedData
    {
        public List<Supplier> Suppliers { get; set; } = new();
        public List<Product> Products { get; set; } = new();
        public List<UserDto> Users { get; set; } = new();
        public List<Invoice> Invoices { get; set; } = new();
    }

    public static async Task SeedAsync(AppDbContext context, IPasswordHasher<User> hasher, string contentRoot)
    {
        // Si ya hay datos, no se toca nada
        if (await context.Users.AnyAsync() || await context.Products.AnyAsync() || await context.Suppliers.AnyAsync() || await context.Invoices.AnyAsync())
            return;

        var path = FindSeedFile(contentRoot);
        var data = path != null
            ? JsonSerializer.Deserialize<SeedData>(await File.ReadAllTextAsync(path), JsonOptions)!
            : BuiltInData();
        Console.WriteLine(path != null ? $"[DbSeeder] Base precargada desde {path}" : "[DbSeeder] Base precargada con datos de ejemplo");

        foreach (var dto in data.Users)
        {
            var user = new User
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                Nombre = dto.Nombre,
                Email = dto.Email,
                Rol = dto.Rol,
                Activo = dto.Activo,
                Telefono = dto.Telefono,
                CreatedAt = dto.CreatedAt,
            };
            user.Password = hasher.HashPassword(user, DefaultPassword);
            context.Users.Add(user);
        }

        foreach (var invoice in data.Invoices)
            foreach (var item in invoice.Items)
            {
                item.InvoiceId = invoice.Id;
                item.Invoice = null;
            }

        context.Suppliers.AddRange(data.Suppliers);
        context.Products.AddRange(data.Products);
        context.Invoices.AddRange(data.Invoices);
        await context.SaveChangesAsync();
    }

    /// <summary>Escribe los datos actuales de la base en Data/seed-data.json (sin contraseñas).</summary>
    public static async Task<string> ExportAsync(AppDbContext context, string contentRoot)
    {
        var data = new SeedData
        {
            Suppliers = await context.Suppliers.AsNoTracking().OrderBy(s => s.Nombre).ToListAsync(),
            Products = await context.Products.AsNoTracking().OrderBy(p => p.Codigo).ToListAsync(),
            Users = (await context.Users.AsNoTracking().OrderBy(u => u.CreatedAt).ToListAsync()).Select(UserDto.From).ToList(),
            Invoices = await context.Invoices.AsNoTracking().Include(i => i.Items).OrderBy(i => i.Fecha).ToListAsync(),
        };
        foreach (var item in data.Invoices.SelectMany(i => i.Items)) item.Invoice = null;

        var path = Path.Combine(contentRoot, "Data", SeedFileName);
        await File.WriteAllTextAsync(path, JsonSerializer.Serialize(data, JsonOptions));
        return path;
    }

    private static string? FindSeedFile(string contentRoot) =>
        new[] { Path.Combine(contentRoot, "Data", SeedFileName), Path.Combine(AppContext.BaseDirectory, "Data", SeedFileName) }
            .FirstOrDefault(File.Exists);

    private static SeedData BuiltInData()
    {
        var aceites = new Supplier { Id = Guid.NewGuid(), Nombre = "Aceites y Filtros S.A.", RIF = "J-87654321", Contacto = "Maria Gomez", Telefono = "0414-9998888", Email = "contacto@aceites.com", Direccion = "Zona Industrial", Ciudad = "Valencia", Activo = true };
        var repuestos = new Supplier { Id = Guid.NewGuid(), Nombre = "Repuestos Caracas C.A.", RIF = "J-12345678", Contacto = "Pedro Pérez", Telefono = "0212-5551111", Email = "ventas@repuestosccs.com", Direccion = "Av. Principal", Ciudad = "Caracas", Activo = true };

        Product Producto(string codigo, string nombre, string descripcion, string categoria, int cantidad, decimal compra, decimal venta, int minimo, Supplier proveedor, string ubicacion) => new()
        {
            Id = Guid.NewGuid(), Codigo = codigo, Nombre = nombre, Descripcion = descripcion, Categoria = categoria,
            Cantidad = cantidad, PrecioCompra = compra, PrecioVenta = venta, StockMinimo = minimo,
            ProveedorId = proveedor.Id, Proveedor = proveedor.Nombre, Ubicacion = ubicacion,
        };

        var aceite = Producto("ACE-001", "Aceite 20W50 Mineral", "Aceite de motor 1L", "Lubricantes", 50, 5.00m, 8.50m, 10, aceites, "Estante A1");
        var filtro = Producto("FIL-001", "Filtro de Aceite Universal", "Rosca estándar", "Filtros", 30, 2.50m, 5.00m, 5, aceites, "Estante A2");
        var pastillas = Producto("PAS-001", "Pastillas de Freno Delanteras", "Cerámica", "Frenos", 15, 20.00m, 35.00m, 4, repuestos, "Pasillo B");

        var factura = new Invoice
        {
            Id = Guid.NewGuid(), NumeroFactura = "FAC-2025-001", Fecha = new DateTime(2025, 10, 10, 14, 0, 0, DateTimeKind.Utc),
            Cliente = "Josefa Mendez", ClienteCedula = "V-12345678", Vehiculo = "Ford Fiesta", Placa = "ABC-123",
            Subtotal = 17.00m, Iva = 2.72m, Total = 19.72m, Estado = "pagada", MetodoPago = "Efectivo", CreadoPor = "Juan Gerente",
        };
        factura.Items.Add(new InvoiceItem { Id = Guid.NewGuid(), InvoiceId = factura.Id, ProductoId = aceite.Id, Producto = aceite.Nombre, Cantidad = 2, PrecioUnitario = 8.50m, Subtotal = 17.00m });

        return new SeedData
        {
            Suppliers = { aceites, repuestos },
            Products = { aceite, filtro, pastillas },
            Users =
            {
                new UserDto(Guid.NewGuid(), "Admin Principal", "admin@taller.com", "admin", true, "0412-9999999", new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
                new UserDto(Guid.NewGuid(), "Juan Gerente", "gerente@taller.com", "gerente", true, "0412-8888888", new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
                new UserDto(Guid.NewGuid(), "Carlos Empleado", "empleado@taller.com", "empleado", true, "0412-7777777", new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc)),
            },
            Invoices = { factura },
        };
    }
}
