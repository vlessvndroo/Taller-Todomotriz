import { useState } from 'react';
import { FileText, Loader2, Minus, Plus, Search, ShoppingCart, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DocumentInput, Field } from '../../components/common/FormFields';
import { useFeedback } from '../../components/feedback/FeedbackProvider';
import { cn } from '../../components/ui/utils';
import { IVA_RATE, METODOS_PAGO } from '../../lib/constants';
import { formatMoney, matches, splitPrefixed } from '../../lib/format';
import type { Factura, ItemFactura, ProductoInventario } from '../../types';
import { calcularTotales } from './facturas';

export interface FacturaFormValues {
  cliente: string;
  clienteCedula: string;
  vehiculo: string | null;
  placa: string | null;
  metodoPago: string;
  observaciones: string | null;
  items: ItemFactura[];
}

interface FacturaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Factura completa (con items) si se está editando */
  factura: Factura | null;
  productos: ProductoInventario[];
  onSave: (values: FacturaFormValues) => Promise<void>;
}

export function FacturaFormDialog({ open, onOpenChange, factura, productos, onSave }: FacturaFormDialogProps) {
  const { toast } = useFeedback();
  const [items, setItems] = useState<ItemFactura[]>([]);
  const [rifTipo, setRifTipo] = useState('V');
  const [rifNumero, setRifNumero] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const [tipo, num] = splitPrefixed(factura?.clienteCedula, 'V');
      setRifTipo(tipo);
      setRifNumero(num);
      setItems(factura?.items ?? []);
      setBusqueda('');
      setCantidad(1);
      setErrors({});
    }
  }

  // Al editar, lo que ya estaba en la factura fue descontado del stock: vuelve a estar disponible
  const disponible = (p: ProductoInventario) =>
    p.cantidad + (factura?.items ?? []).filter((i) => i.productoId === p.id).reduce((acc, i) => acc + i.cantidad, 0);
  const enCarrito = (productoId: string) => items.find((i) => i.productoId === productoId)?.cantidad ?? 0;

  const resultados = productos.filter((p) => matches(busqueda, p.nombre, p.codigo, p.categoria)).slice(0, 30);
  const { subtotal, iva, total } = calcularTotales(items);

  const setCantidadItem = (producto: ProductoInventario | undefined, productoId: string, nueva: number) => {
    if (nueva <= 0) {
      setItems(items.filter((i) => i.productoId !== productoId));
      return;
    }
    if (producto && nueva > disponible(producto)) {
      toast(`No hay suficiente stock. Disponible: ${disponible(producto)}`, 'error');
      return;
    }
    setItems(items.map((i) => (i.productoId === productoId ? { ...i, cantidad: nueva, subtotal: nueva * i.precioUnitario } : i)));
  };

  const agregar = (producto: ProductoInventario) => {
    if (cantidad <= 0) {
      toast('La cantidad debe ser mayor a 0', 'error');
      return;
    }
    const actual = enCarrito(producto.id);
    if (actual + cantidad > disponible(producto)) {
      toast(
        actual > 0
          ? `No puedes agregar más. Total en carrito: ${actual}. Disponible: ${disponible(producto)}`
          : `Error: No hay suficiente stock. Disponible: ${disponible(producto)}`,
        'error',
      );
      return;
    }
    if (actual > 0) {
      setCantidadItem(producto, producto.id, actual + cantidad);
    } else {
      setItems([
        ...items,
        {
          id: `${Date.now()}`,
          productoId: producto.id,
          producto: producto.nombre,
          cantidad,
          precioUnitario: producto.precioVenta,
          subtotal: cantidad * producto.precioVenta,
        },
      ]);
    }
    setCantidad(1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const next: Record<string, string> = {};
    if (rifNumero.length < 6) next.clienteCedula = 'La cédula debe tener al menos 6 dígitos.';
    if (items.length === 0) next.items = 'Agrega al menos un producto.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        cliente: (form.get('cliente') as string).trim(),
        clienteCedula: `${rifTipo}-${rifNumero}`,
        vehiculo: (form.get('vehiculo') as string) || null,
        placa: ((form.get('placa') as string) || '').toUpperCase() || null,
        metodoPago: form.get('metodoPago') as string,
        observaciones: (form.get('observaciones') as string) || null,
        items,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto p-0 sm:max-w-5xl">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px]">
          {/* Datos + productos */}
          <div className="space-y-6 p-6">
            <DialogHeader>
              <DialogTitle>{factura ? 'Modificar factura' : 'Nueva factura'}</DialogTitle>
              <DialogDescription>
                {factura ? `Editando ${factura.numeroFactura}` : 'Complete los datos para generar una nueva venta'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cliente" htmlFor="cliente">
                <Input id="cliente" name="cliente" required defaultValue={factura?.cliente} placeholder="Nombre y apellido" />
              </Field>
              <Field label="Cédula / RIF" htmlFor="clienteCedula" error={errors.clienteCedula}>
                <DocumentInput
                  id="clienteCedula"
                  prefix={rifTipo}
                  onPrefixChange={setRifTipo}
                  number={rifNumero}
                  onNumberChange={setRifNumero}
                  required
                  invalid={!!errors.clienteCedula}
                />
              </Field>
              <Field label="Vehículo" htmlFor="vehiculo">
                <Input id="vehiculo" name="vehiculo" required defaultValue={factura?.vehiculo ?? ''} placeholder="Ej: Ford Fiesta 2015" />
              </Field>
              <Field label="Placa" htmlFor="placa">
                <Input id="placa" name="placa" required defaultValue={factura?.placa ?? ''} placeholder="ABC-123" className="uppercase" />
              </Field>
              <Field label="Método de pago">
                <Select name="metodoPago" defaultValue={factura?.metodoPago || 'Efectivo'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Observaciones" htmlFor="observaciones">
                <Textarea id="observaciones" name="observaciones" rows={1} defaultValue={factura?.observaciones ?? ''} className="min-h-10" />
              </Field>
            </div>

            {/* Buscador de productos */}
            <div className="rounded-xl border bg-muted/30">
              <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar producto por nombre o código..."
                    className="pl-9"
                    aria-label="Buscar producto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="cantidad" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cant.
                  </label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="tabular w-20"
                  />
                </div>
              </div>
              <ul className="max-h-60 divide-y overflow-y-auto">
                {resultados.length === 0 && (
                  <li className="p-4 text-center text-sm text-muted-foreground">No se encontraron productos</li>
                )}
                {resultados.map((p) => {
                  const stock = disponible(p) - enCarrito(p.id);
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span> {p.nombre}
                        </p>
                        <p className={cn('text-xs', stock <= 0 ? 'text-destructive' : 'text-muted-foreground')}>
                          {formatMoney(p.precioVenta)} · Stock: {stock}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => agregar(p)}
                        disabled={stock <= 0}
                        aria-label={`Agregar ${p.nombre}`}
                      >
                        <Plus className="size-4" /> Agregar
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Carrito */}
          <aside className="flex flex-col border-t bg-muted/40 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <ShoppingCart className="size-5 text-warning" />
              <h3 className="text-lg font-bold uppercase">Carrito</h3>
              <span className="tabular ml-auto rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                {items.reduce((acc, i) => acc + i.cantidad, 0)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
                  <ShoppingCart className="size-8 opacity-40" />
                  <p className="font-medium">Carrito vacío</p>
                  {errors.items && <p className="text-xs font-medium text-destructive">{errors.items}</p>}
                </div>
              ) : (
                <ul className="divide-y">
                  {items.map((item) => {
                    const producto = productos.find((p) => p.id === item.productoId);
                    return (
                      <li key={item.productoId} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">{item.producto}</p>
                          <button
                            type="button"
                            onClick={() => setCantidadItem(producto, item.productoId, 0)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Quitar ${item.producto}`}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-lg border bg-card">
                            <button
                              type="button"
                              onClick={() => setCantidadItem(producto, item.productoId, item.cantidad - 1)}
                              className="p-1.5 hover:bg-muted"
                              aria-label="Restar uno"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="tabular w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => setCantidadItem(producto, item.productoId, item.cantidad + 1)}
                              className="p-1.5 hover:bg-muted"
                              aria-label="Sumar uno"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="tabular text-sm font-semibold">{formatMoney(item.subtotal)}</p>
                            <p className="tabular text-xs text-muted-foreground">{formatMoney(item.precioUnitario)} c/u</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-3 border-t bg-card p-5">
              <dl className="tabular space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">IVA ({Math.round(IVA_RATE * 100)}%)</dt>
                  <dd>{formatMoney(iva)}</dd>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-display text-3xl font-bold">{formatMoney(total)}</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={items.length === 0 || saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                  {factura ? 'Guardar cambios' : 'Generar factura'}
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  );
}
