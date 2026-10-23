# 🚗 Todomotriz - Sistema Integral de Gestión de Taller y Repuestos Automotrices

Sistema completo de gestión y punto de venta diseñado para talleres mecánicos y tiendas de repuestos automotrices. Permite administrar de forma centralizada inventario, facturación con descuento automático de stock, control de proveedores, usuarios con roles jerárquicos (RBAC) y métricas en tiempo real mediante un dashboard interactivo.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Roles y Matriz de Permisos](#-roles-y-matriz-de-permisos)
- [Credenciales de Prueba (Seed Data)](#-credenciales-de-prueba-seed-data)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
  - [Opción 1: Inicio Rápido (Windows)](#opción-1-inicio-rápido-script-startbat)
  - [Opción 2: Inicio Manual](#opción-2-inicio-manual)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación de la API (REST)](#-documentación-de-la-api-rest)
- [Flujos Clave del Negocio](#-flujos-clave-del-negocio)

---

## ✨ Características Principales

- **📊 Dashboard Interactivo**:
  - Métricas clave en tiempo real: productos en stock, facturas del mes, proveedores activos y usuarios registrados.
  - Cálculo automático de ventas del día en estado pagado.
  - Alertas prioritarias: productos con stock igual o inferior al mínimo y facturas pendientes de cobro.

- **📦 Gestión de Inventario**:
  - Catálogo completo con código único, nombre, categoría, ubicación física (estantes/pasillos), precios de costo y venta.
  - Control de existencias y umbral de stock mínimo con indicadores visuales.
  - Búsqueda dinámica y filtrado de productos.

- **🧾 Facturación y Ventas**:
  - Emisión de facturas con cálculo en vivo de subtotal, IVA (16%) y total.
  - Registro de cliente con documento de identidad adaptado al formato venezolano (V, J, E, G).
  - Registro del vehículo asociado (modelo y placa).
  - Selección dinámica de ítems con validación de stock disponible.
  - **Descuento automático de inventario** en base de datos al generar la factura.
  - Gestión de estados de factura: *Pagada*, *Pendiente*, *Anulada*.
  - Vista previa de factura en formato para impresión.

- **🚚 Gestión de Proveedores**:
  - Ficha completa de proveedores: RIF/Cédula, contacto, teléfonos con códigos de área locales/móviles (0412, 0414, 0424, 0416, 0426, 0212), correo electrónico y dirección.
  - Catálogo asociado a productos del inventario.

- **👥 Control de Acceso Basado en Roles (RBAC)**:
  - Sistema de autenticación con usuarios activos/inactivos.
  - Tres niveles jerárquicos: **Administrador**, **Gerente** y **Empleado**.

---

## 🛠 Tecnologías Utilizadas

### Backend
- **Lenguaje & Framework**: C# con .NET 8 / .NET 10 (ASP.NET Core Web API).
- **ORM**: Entity Framework Core con SQLite.
- **Documentación API**: Swagger / OpenAPI (Swashbuckle).
- **Patrones**: Arquitectura en capas (Controllers, Services, Repositories) y Repository Pattern.
- **Base de Datos**: SQLite (`todomotriz.db`).

### Frontend
- **Framework**: React 19 con TypeScript y Vite.
- **Estilos & UI**: Tailwind CSS, Radix UI Primitives, Lucide React (iconografía).
- **Componentes**: Tablas con filtros y búsqueda, diálogos modales, avisos (toasts), tema claro/oscuro.
- **Tipografía**: Barlow y Barlow Condensed (incluidas localmente, funcionan sin internet).
- **Manejo de Estado**: React Context API (`AuthContext`), LocalStorage para persistencia de sesión.

---

## 📐 Arquitectura del Sistema

```mermaid
graph TD
    Client["Frontend (React 19 + TypeScript + Vite)"] -->|HTTP / JSON (REST)| API["Backend (.NET Web API)"]
    
    subgraph Backend [.NET Core Web API]
        Controllers["Controllers (Auth, Products, Invoices, Suppliers, Users)"]
        Services["Business Services (IProductService, IInvoiceService, etc.)"]
        Repos["Repositories (IRepository, Generic EF Core)"]
        DbContext["Entity Framework Core (AppDbContext)"]
        
        Controllers --> Services
        Services --> Repos
        Repos --> DbContext
    end
    
    DbContext -->|SQLite| DB[(todomotriz.db)]
```

---

## 🔐 Roles y Matriz de Permisos

El sistema implementa una matriz de control de acceso estricta:

| Módulo | Acción | Administrador (`admin`) | Gerente (`gerente`) | Empleado (`empleado`) |
| :--- | :--- | :---: | :---: | :---: |
| **Inventario** | Ver Catálogo | ✅ | ✅ | ✅ |
| | Crear Producto | ✅ | ✅ | ❌ |
| | Editar Producto | ✅ | ✅ | ❌ |
| | Eliminar Producto | ✅ | ❌ | ❌ |
| **Facturación** | Ver Facturas | ✅ | ✅ | ✅ |
| | Crear Factura | ✅ | ✅ | ✅ |
| | Editar Factura | ✅ | ✅ | ❌ |
| | Anular Factura | ✅ | ✅ | ❌ |
| **Proveedores** | Ver Lista | ✅ | ✅ | ✅ |
| | Crear Proveedor | ✅ | ✅ | ❌ |
| | Editar Proveedor | ✅ | ✅ | ❌ |
| | Eliminar Proveedor | ✅ | ❌ | ❌ |
| **Usuarios** | Ver Usuarios | ✅ | ✅ *(solo lectura)* | ❌ |
| | Crear/Editar/Eliminar | ✅ | ❌ | ❌ |

---

## 🔑 Credenciales de Prueba (Seed Data)

Al inicializarse por primera vez, el backend crea y precarga automáticamente la base de datos con las siguientes cuentas de prueba:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@taller.com` | `password123` | Control total del sistema |
| **Gerente** | `gerente@taller.com` | `password123` | Gestión de inventario, proveedores y facturación |
| **Empleado** | `empleado@taller.com` | `password123` | Emisión de facturas y consulta de inventario |

> [!NOTE]
> Todos los usuarios precargados tienen la contraseña por defecto `password123`.

---

## ⚙️ Requisitos Previos

Asegúrate de contar con los siguientes componentes instalados en tu sistema:
- [.NET 8.0 SDK o superior](https://dotnet.microsoft.com/download)
- [Node.js (v18 o superior)](https://nodejs.org/) y `npm`
- Git (opcional para clonar el repositorio)

---

## 🚀 Instalación y Puesta en Marcha

### Opción 1: Inicio Rápido (Script `start.bat`)

En sistemas operativos Windows, puedes iniciar ambos servicios (Backend y Frontend) de forma automatizada ejecutando el archivo por lotes en la raíz del proyecto:

```cmd
start.bat
```

Este script abrirá automáticamente dos ventanas de consola:
1. **Backend API**: Restaura y ejecuta la API de .NET.
2. **Frontend**: Instala dependencias (`npm install`) y levanta el servidor de desarrollo de Vite.

---

### Opción 2: Inicio Manual

Si deseas ejecutar cada servicio de forma individual:

#### 1. Iniciar el Backend (.NET API)
Desde una terminal en la raíz del proyecto:
```bash
cd backend
dotnet restore
dotnet run --project Todomotriz.Api.csproj
```
- La API se iniciará por defecto en `http://localhost:5000` (o `https://localhost:5001`).
- Interfaz interactiva de **Swagger UI**: [http://localhost:5000/swagger](http://localhost:5000/swagger)

#### 2. Iniciar el Frontend (React + Vite)
En otra terminal desde la raíz del proyecto:
```bash
cd frontend
npm install
npm run dev
```
- La aplicación web estará accesible en [http://localhost:5173](http://localhost:5173).

---

## 📁 Estructura del Proyecto

```text
Todomotriz-main/
├── Todomotriz-main.sln        # Solución de Visual Studio para el proyecto .NET
├── start.bat                  # Script para arranque simultáneo de Backend y Frontend
│
├── backend/                   # Proyecto Backend (.NET Web API)
│   ├── Controllers/           # Controladores REST (Auth, Invoices, Products, Suppliers, Users)
│   ├── Data/                  # DbContext (EF Core) y Seeder de datos iniciales
│   ├── Models/                # Entidades de dominio (User, Product, Supplier, Invoice, InvoiceItem)
│   ├── Repositories/          # Acceso a datos: IRepository genérico + repositorios por entidad
│   ├── Services/              # Lógica de negocio (interfaces I*Service + implementaciones)
│   ├── Program.cs             # Configuración de dependencias, CORS, DB y middleware
│   └── Todomotriz.Api.csproj  # Configuración y paquetes NuGet del proyecto .NET
│
└── frontend/                  # Proyecto Frontend (React 19 + TypeScript + Vite)
    ├── public/                # Archivos estáticos
    ├── src/
    │   ├── pages/             # Pantallas, cada una en su carpeta con sus diálogos
    │   │   ├── LoginPage.tsx
    │   │   ├── dashboard/     # Métricas, gráfico de ventas de 7 días y alertas
    │   │   ├── inventario/    # Listado + formulario de producto
    │   │   ├── facturacion/   # Listado, formulario con carrito y comprobante imprimible
    │   │   ├── proveedores/   # Listado + formulario de proveedor
    │   │   └── usuarios/      # Listado, formulario y tabla de roles
    │   ├── components/
    │   │   ├── common/        # Piezas compartidas: encabezados, paneles, filtros, estados, campos
    │   │   ├── feedback/      # Avisos (toasts) y diálogos de confirmación
    │   │   ├── layout/        # Barra lateral, menú móvil y logo
    │   │   └── ui/            # Componentes base (botón, input, select, tabla, diálogo)
    │   ├── contexts/          # AuthContext con la matriz de permisos (RBAC)
    │   ├── lib/               # API, formatos, constantes, tema claro/oscuro, carga de datos
    │   ├── types/             # Interfaces TypeScript (Factura, Producto, Usuario, etc.)
    │   ├── App.tsx            # Navegación según autenticación
    │   ├── index.css          # Tokens de diseño (colores claro/oscuro) y estilos de impresión
    │   └── main.tsx           # Punto de entrada (fuentes y tema)
    ├── package.json           # Dependencias de npm y scripts
    ├── tailwind.config.ts     # Tema de Tailwind (lee los tokens de index.css)
    └── vite.config.ts         # Configuración del empaquetador Vite
```

> La base de datos SQLite (`backend/todomotriz.db`) no se versiona: se crea y precarga automáticamente al iniciar la API por primera vez.
>
> La URL del backend se puede cambiar creando `frontend/.env` con `VITE_API_URL=http://otra-url:puerto`.

---

## 🌐 Documentación de la API (REST)

La API expone los siguientes endpoints principales:

### Autenticación
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autentica usuario y devuelve datos de sesión y rol |

### Inventario / Productos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Lista todos los productos en inventario |
| `GET` | `/api/products/{id}` | Obtiene el detalle de un producto específico |
| `GET` | `/api/products/search?q={term}` | Búsqueda rápida por nombre/código |
| `POST` | `/api/products` | Registra un nuevo producto |
| `PUT` | `/api/products/{id}` | Actualiza información y stock de un producto |
| `DELETE` | `/api/products/{id}` | Elimina un producto del catálogo |

### Facturación
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/invoices` | Obtiene el historial de facturas |
| `GET` | `/api/invoices/{id}` | Obtiene una factura y sus ítems detallados |
| `POST` | `/api/invoices` | Crea factura y **descuenta stock automáticamente** |
| `PUT` | `/api/invoices/{id}` | Actualiza estado (ej. cambio a pagada o anulada) |
| `DELETE` | `/api/invoices/{id}` | Elimina un registro de factura |

### Proveedores
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/suppliers` | Obtiene todos los proveedores |
| `POST` | `/api/suppliers` | Registra un nuevo proveedor |
| `PUT` | `/api/suppliers/{id}` | Modifica datos de contacto y RIF |
| `DELETE` | `/api/suppliers/{id}` | Elimina un proveedor |

### Usuarios
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/users` | Lista los usuarios del sistema |
| `POST` | `/api/users` | Crea un usuario con rol asignado |
| `PUT` | `/api/users/{id}` | Modifica rol, estado activo/inactivo o datos |
| `DELETE` | `/api/users/{id}` | Elimina un usuario |

---

## 🔄 Flujos Clave del Negocio

1. **Ciclo de Facturación y Rebaja Automática de Inventario**:
   - Al agregar productos a una factura en el frontend, se valida que la cantidad solicitada no supere la existencia actual.
   - Al confirmar la creación (`POST /api/invoices`), el backend procesa la factura dentro de la misma transacción e itera sobre cada ítem descontando la cantidad vendida del campo `Cantidad` del producto correspondiente (`Product.Cantidad -= item.Cantidad`).
   - El inventario se actualiza de inmediato para reflejar las nuevas existencias.

2. **Control de Stock y Alertas de Reabastecimiento**:
   - Si `Cantidad <= StockMinimo`, el producto se resalta con badges de advertencia en el módulo de inventario y se suma al contador de alertas del Dashboard principal para solicitar reposición a los proveedores asociados.

3. **Impresión y Respaldo de Facturas**:
   - Cada factura puede consultarse en detalle para emitir un comprobante imprimible con membrete comercial, datos fiscales, desglose de ítems, impuesto discriminado y forma de pago.
