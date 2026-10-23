import { IVA_RATE } from '../../lib/constants';
import type { Factura, ItemFactura } from '../../types';

export function calcularTotales(items: ItemFactura[]) {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const iva = subtotal * IVA_RATE;
  return { subtotal, iva, total: subtotal + iva };
}

/**
 * Siguiente número correlativo del año en curso: FAC-2026-001, FAC-2026-002...
 * Se basa en el mayor número existente (no en la cantidad de facturas) para no repetir.
 */
export function siguienteNumeroFactura(facturas: Factura[], fecha = new Date()) {
  const prefijo = `FAC-${fecha.getFullYear()}-`;
  const mayor = facturas
    .filter((f) => f.numeroFactura?.startsWith(prefijo))
    .map((f) => Number(f.numeroFactura.slice(prefijo.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefijo}${String(mayor + 1).padStart(3, '0')}`;
}
