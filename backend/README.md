# Todomotriz API (backend)

API REST en ASP.NET Core (.NET 10) con Entity Framework Core y SQLite. La documentación general del sistema está en el [README principal](../README.md).

## Ejecutar localmente

Requiere el .NET 10 SDK. Desde la carpeta `backend`:

```powershell
dotnet run
```

- La API queda en `http://localhost:5000` y Swagger en `http://localhost:5000/swagger`.
- Si `todomotriz.db` no existe, se crea y se precarga desde `Data/seed-data.json`.
- Si existe pero viene de una versión anterior, `Data/SchemaUpdater.cs` la actualiza al arrancar (sin perder datos).
- En el primer arranque se genera `jwt-key.txt`, la clave que firma los tokens (no se versiona). También se puede definir con la configuración `Jwt:Key`.

## Exportar los datos actuales como semilla

```powershell
dotnet run -- --export-seed
```

Escribe `Data/seed-data.json` (sin contraseñas) y termina. Los usuarios precargados desde ese archivo entran con `password123`.

## Uso desde el frontend

Primero se inicia sesión y luego se envía el token en cada petición:

```javascript
const login = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@taller.com', password: 'password123' }),
}).then((r) => r.json());

const productos = await fetch('http://localhost:5000/api/products', {
  headers: { Authorization: `Bearer ${login.token}` },
}).then((r) => r.json());
```

Crear una factura: solo se envían los datos del cliente y los productos con su cantidad. El backend asigna el número, los precios, el IVA y los totales, y descuenta el stock:

```javascript
await fetch('http://localhost:5000/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` },
  body: JSON.stringify({
    cliente: 'Cliente Ejemplo',
    clienteCedula: 'V-12345678',
    vehiculo: 'Ford Fiesta',
    placa: 'ABC-123',
    metodoPago: 'Efectivo',
    items: [{ productoId: '<id del producto>', cantidad: 2 }],
  }),
});
```

En el frontend esto lo hace `src/lib/api.ts`, que agrega el token automáticamente.

## CORS

Se permiten peticiones desde `http://localhost:5173` (Vite). Si el frontend corre en otro origen, ajusta la política en `Program.cs`.
