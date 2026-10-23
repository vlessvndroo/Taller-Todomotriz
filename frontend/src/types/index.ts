export type UserRole = 'admin' | 'gerente' | 'empleado';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  telefono?: string;
  createdAt: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface ProductoInventario {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  /** Vínculo real con el proveedor */
  proveedorId: string | null;
  /** Nombre del proveedor (copia que mantiene el backend) */
  proveedor: string | null;
  ubicacion: string;
  ultimaActualizacion: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  rif: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
  createdAt: string;
}

export interface ItemFactura {
  id: string;
  productoId: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Factura {
  id: string;
  numeroFactura: string;
  fecha: string;
  cliente: string;
  clienteCedula: string;
  vehiculo: string;
  placa: string;
  items: ItemFactura[];
  subtotal: number;
  iva: number;
  total: number;
  estado: 'pagada' | 'pendiente' | 'anulada';
  metodoPago: string;
  observaciones?: string;
  creadoPor: string;
}

export interface RolePermissions {
  inventario: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  };
  facturacion: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    anular: boolean;
  };
  proveedores: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  };
  usuarios: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  };
}
