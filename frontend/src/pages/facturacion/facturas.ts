import { IVA_RATE } from '../../lib/constants';
import type { ItemFactura } from '../../types';

/** Totales para la vista previa del carrito (el backend los recalcula al guardar) */
export function calcularTotales(items: ItemFactura[]) {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const iva = subtotal * IVA_RATE;
  return { subtotal, iva, total: subtotal + iva };
}
