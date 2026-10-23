import type { UserRole } from '../types';

/** IVA aplicado a las facturas (16% Venezuela) */
export const IVA_RATE = 0.16;

/** Prefijos de cédula / RIF venezolanos */
export const TIPOS_DOCUMENTO = ['V', 'J', 'E', 'G'];

/** Códigos de área móviles y fijos de Venezuela */
export const PREFIJOS_TELEFONICOS = ['0412', '0414', '0424', '0416', '0426', '0422', '0212'];

export const CATEGORIAS_PRODUCTO = [
  'Filtros',
  'Lubricantes',
  'Frenos',
  'Baterías',
  'Llantas',
  'Electricidad',
  'Suspensión',
  'Motor',
  'Transmisión',
];

export const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia'];

export const ROLES: Record<UserRole, { label: string; permisos: string[] }> = {
  admin: {
    label: 'Administrador',
    permisos: ['Todos los permisos'],
  },
  gerente: {
    label: 'Gerente',
    permisos: [
      'Inventario (ver, crear, editar)',
      'Facturación (completa)',
      'Proveedores (ver, crear, editar)',
      'Usuarios (solo ver)',
    ],
  },
  empleado: {
    label: 'Empleado',
    permisos: ['Inventario (solo ver)', 'Facturación (crear)', 'Proveedores (solo ver)'],
  },
};
