import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Field } from '../../components/common/FormFields';
import { useFeedback } from '../../components/feedback/FeedbackProvider';
import { CATEGORIAS_PRODUCTO } from '../../lib/constants';
import { formatMoney } from '../../lib/format';
import type { ProductoInventario } from '../../types';

export type ProductoPayload = Omit<ProductoInventario, 'id' | 'ultimaActualizacion'>;

interface ProductoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: ProductoInventario | null;
  proveedores: string[];
  onSave: (payload: ProductoPayload) => Promise<void>;
}

export function ProductoFormDialog({ open, onOpenChange, producto, proveedores, onSave }: ProductoFormDialogProps) {
  const { confirm } = useFeedback();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');

  // Reinicia el formulario cada vez que se abre
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setErrors({});
      setPrecioCompra(producto ? String(producto.precioCompra) : '');
      setPrecioVenta(producto ? String(producto.precioVenta) : '');
    }
  }

  const compra = Number(precioCompra);
  const venta = Number(precioVenta);
  const margen = compra > 0 && venta > 0 ? ((venta - compra) / compra) * 100 : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const payload = {
      codigo: (form.get('codigo') as string).trim(),
      nombre: (form.get('nombre') as string).trim(),
      descripcion: (form.get('descripcion') as string) || null,
      categoria: (form.get('categoria') as string) || null,
      cantidad: Number(form.get('cantidad')),
      precioCompra: compra,
      precioVenta: venta,
      stockMinimo: Number(form.get('stockMinimo')),
      proveedor: (form.get('proveedor') as string) || null,
      ubicacion: (form.get('ubicacion') as string) || null,
    } as unknown as ProductoPayload;

    const next: Record<string, string> = {};
    if (!payload.nombre) next.nombre = 'El nombre es requerido.';
    else if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(payload.nombre))
      next.nombre = 'El nombre debe contener letras (no puede ser solo números).';
    if (payload.cantidad < 0) next.cantidad = 'La cantidad no puede ser negativa.';
    if (payload.precioCompra < 0) next.precioCompra = 'El precio de compra no puede ser negativo.';
    if (payload.precioVenta < 0) next.precioVenta = 'El precio de venta no puede ser negativo.';
    if (payload.stockMinimo < 0) next.stockMinimo = 'El stock mínimo no puede ser negativo.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (payload.precioVenta < payload.precioCompra) {
      const ok = await confirm({
        title: 'Precio de venta menor al costo',
        description: `Vas a vender a ${formatMoney(payload.precioVenta)} un producto que cuesta ${formatMoney(payload.precioCompra)}. ¿Guardar de todas formas?`,
        confirmLabel: 'Guardar igual',
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{producto ? 'Editar producto' : 'Agregar nuevo producto'}</DialogTitle>
          <DialogDescription>Complete los datos del producto.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
            <Field label="Código" htmlFor="codigo">
              <Input id="codigo" name="codigo" defaultValue={producto?.codigo} placeholder="ACE-001" required className="uppercase" />
            </Field>
            <Field label="Nombre" htmlFor="nombre" error={errors.nombre}>
              <Input id="nombre" name="nombre" defaultValue={producto?.nombre} placeholder="Aceite 20W50 Mineral" required />
            </Field>
            <Field label="Descripción" htmlFor="descripcion" className="md:col-span-2">
              <Textarea id="descripcion" name="descripcion" defaultValue={producto?.descripcion ?? ''} rows={2} />
            </Field>
            <Field label="Categoría">
              <Select name="categoria" defaultValue={producto?.categoria ?? undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_PRODUCTO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Proveedor">
              <Select name="proveedor" defaultValue={producto?.proveedor ?? undefined}>
                <SelectTrigger>
                  <SelectValue placeholder={proveedores.length ? 'Seleccione' : 'No hay proveedores'} />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <fieldset className="rounded-xl border bg-muted/30 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precios</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Precio compra ($)" htmlFor="precioCompra" error={errors.precioCompra}>
                <Input
                  id="precioCompra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value)}
                  required
                  className="tabular"
                />
              </Field>
              <Field label="Precio venta ($)" htmlFor="precioVenta" error={errors.precioVenta}>
                <Input
                  id="precioVenta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  required
                  className="tabular"
                />
              </Field>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Margen</p>
                <div className="flex h-10 items-center rounded-lg border border-dashed bg-card px-3">
                  {margen === null ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    <span className={`tabular font-display text-xl font-bold ${margen < 0 ? 'text-destructive' : 'text-success'}`}>
                      {margen.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={producto ? 'Cantidad en stock' : 'Cantidad inicial'} htmlFor="cantidad" error={errors.cantidad}>
              <Input id="cantidad" name="cantidad" type="number" min="0" defaultValue={producto?.cantidad} required className="tabular" />
            </Field>
            <Field label="Stock mínimo" htmlFor="stockMinimo" error={errors.stockMinimo} hint="Alerta al llegar a este nivel">
              <Input id="stockMinimo" name="stockMinimo" type="number" min="0" defaultValue={producto?.stockMinimo} required className="tabular" />
            </Field>
            <Field label="Ubicación" htmlFor="ubicacion">
              <Input id="ubicacion" name="ubicacion" defaultValue={producto?.ubicacion ?? ''} placeholder="Ej: Estante A-12" required />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {producto ? 'Guardar cambios' : 'Agregar producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
