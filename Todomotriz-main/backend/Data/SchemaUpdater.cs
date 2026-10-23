using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Data;

/// <summary>
/// La base se crea con EnsureCreated (sin migraciones de EF), que no modifica una base
/// existente. Este actualizador aplica, de forma idempotente, los cambios de esquema
/// y de datos que necesitan las bases creadas con versiones anteriores.
/// </summary>
public static class SchemaUpdater
{
    public static async Task ApplyAsync(AppDbContext db, IPasswordHasher<User> hasher)
    {
        await AddProveedorIdAsync(db);
        await HashPlainPasswordsAsync(db, hasher);
    }

    /// <summary>Products.ProveedorId: se agrega la columna y se completa buscando el proveedor por nombre.</summary>
    private static async Task AddProveedorIdAsync(AppDbContext db)
    {
        if (await ColumnExistsAsync(db, "Products", "ProveedorId")) return;

        await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Products\" ADD COLUMN \"ProveedorId\" TEXT NULL");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS \"IX_Products_ProveedorId\" ON \"Products\" (\"ProveedorId\")");

        var proveedores = await db.Suppliers.AsNoTracking().ToListAsync();
        var productos = await db.Products.Where(p => p.Proveedor != null).ToListAsync();
        foreach (var producto in productos)
        {
            var match = proveedores.FirstOrDefault(s =>
                string.Equals(s.Nombre.Trim(), producto.Proveedor!.Trim(), StringComparison.OrdinalIgnoreCase));
            if (match != null) producto.ProveedorId = match.Id;
        }
        await db.SaveChangesAsync();
        Console.WriteLine($"[SchemaUpdater] Columna ProveedorId agregada; {productos.Count(p => p.ProveedorId != null)} producto(s) vinculados.");
    }

    /// <summary>Convierte a hash las contraseñas que todavía estén guardadas en texto plano.</summary>
    private static async Task HashPlainPasswordsAsync(AppDbContext db, IPasswordHasher<User> hasher)
    {
        var users = await db.Users.ToListAsync();
        var pendientes = users.Where(u => !IsHash(u.Password)).ToList();
        if (pendientes.Count == 0) return;

        foreach (var user in pendientes)
        {
            var plano = string.IsNullOrEmpty(user.Password) ? DbSeeder.DefaultPassword : user.Password;
            user.Password = hasher.HashPassword(user, plano);
        }
        await db.SaveChangesAsync();
        Console.WriteLine($"[SchemaUpdater] {pendientes.Count} contraseña(s) convertidas a hash.");
    }

    /// <summary>Formato v3 de PasswordHasher: base64 de 61+ bytes que empieza con el byte 0x01.</summary>
    public static bool IsHash(string? value)
    {
        if (string.IsNullOrEmpty(value) || value.Length < 80 || value.Length > 512) return false;
        Span<byte> buffer = stackalloc byte[value.Length];
        return Convert.TryFromBase64String(value, buffer, out var written) && written >= 61 && buffer[0] == 0x01;
    }

    private static async Task<bool> ColumnExistsAsync(AppDbContext db, string table, string column)
    {
        var conn = db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name = '{column}'";
        return Convert.ToInt64(await cmd.ExecuteScalarAsync()) > 0;
    }
}
