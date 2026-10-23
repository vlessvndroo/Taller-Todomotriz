## Ejecutar localmente

Asegúrate de tener .NET 10 SDK instalado.
Desde PowerShell, en la carpeta `backend`:

```powershell
cd backend
dotnet restore
dotnet build
dotnet run
```

La API correrá por defecto en `https://localhost:5001` o `http://localhost:5000` (ver salida del `dotnet run`).

Swagger UI estará en: `https://localhost:5001/swagger` (o el puerto que muestre la consola).

## CORS

Se habilitó una política CORS que permite requests desde `http://localhost:5173` (puerto por defecto de Vite). Si tu frontend corre en otro origen, ajusta `Program.cs`.

## Ejemplos de fetch desde React

GET todos los productos:

```javascript
const res = await fetch('https://localhost:5001/api/products');
const products = await res.json();
console.log(products);
```

GET producto por id:

```javascript
const res = await fetch(`https://localhost:5001/api/products/${id}`);
const product = await res.json();
```

POST crear usuario:

```javascript
const newUser = {
	nombre: 'Nuevo Usuario',
	email: 'nuevo@taller.com',
	rol: 'empleado',
	activo: true
};

const res = await fetch('https://localhost:5001/api/users', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(newUser),
});

const created = await res.json();
console.log(created);
```

POST crear factura (ejemplo simplificado):

```javascript
const invoice = {
	numeroFactura: 'FAC-2025-001',
	fecha: new Date().toISOString(),
	cliente: 'Cliente Ejemplo',
	items: [
		{ productoId: '00000000-0000-0000-0000-000000000000', producto: 'Filtro', cantidad: 1, precioUnitario: 15, subtotal: 15 }
	],
	subtotal: 15,
	iva: 1.8,
	total: 16.8,
	estado: 'pendiente'
};

const res = await fetch('https://localhost:5001/api/invoices', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(invoice),
});
const createdInvoice = await res.json();
```

Nota: Si usas `https://localhost:5001` y tu navegador reclama certificados, permite confiar en el certificado de desarrollo o usa `http://localhost:5000` para pruebas locales.

## Swagger

La API incluye Swagger; abre `/swagger` para explorar los endpoints y probarlos desde la UI.
