import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DocumentInput, Field, PhoneInput } from '../../components/common/FormFields';
import { splitPrefixed } from '../../lib/format';
import { Toggle } from '../../components/common/Toggle';
import type { Proveedor } from '../../types';

export type ProveedorPayload = Omit<Proveedor, 'id' | 'createdAt'>;

interface ProveedorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor: Proveedor | null;
  onSave: (payload: ProveedorPayload) => Promise<void>;
}

export function ProveedorFormDialog({ open, onOpenChange, proveedor, onSave }: ProveedorFormDialogProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [rifTipo, setRifTipo] = useState('J');
  const [rifNumero, setRifNumero] = useState('');
  const [tlfPrefijo, setTlfPrefijo] = useState('0412');
  const [tlfNumero, setTlfNumero] = useState('');
  const [activo, setActivo] = useState(true);

  // Prepara los campos divididos cada vez que se abre el diálogo
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const [tipo, num] = splitPrefixed(proveedor?.rif, 'J');
      const [pref, tel] = splitPrefixed(proveedor?.telefono, '0412');
      setRifTipo(tipo);
      setRifNumero(num);
      setTlfPrefijo(pref);
      setTlfNumero(tel);
      setActivo(proveedor?.activo ?? true);
      setErrors({});
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const next: Record<string, string> = {};
    if (rifNumero.length < 6) next.rif = 'Debe tener al menos 6 dígitos.';
    if (!/^\d{7}$/.test(tlfNumero)) next.telefono = 'El número debe tener exactamente 7 dígitos (ej: 1234567)';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      nombre: (form.get('nombre') as string).trim(),
      rif: `${rifTipo}-${rifNumero}`,
      contacto: (form.get('contacto') as string) || null,
      telefono: `${tlfPrefijo}-${tlfNumero}`,
      email: (form.get('email') as string) || null,
      direccion: (form.get('direccion') as string) || null,
      ciudad: (form.get('ciudad') as string) || null,
      activo,
    } as unknown as ProveedorPayload;

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
          <DialogTitle>{proveedor ? 'Editar proveedor' : 'Agregar nuevo proveedor'}</DialogTitle>
          <DialogDescription>Información de contacto de la empresa o proveedor.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Razón social / Nombre" htmlFor="nombre" className="md:col-span-2">
              <Input id="nombre" name="nombre" defaultValue={proveedor?.nombre} placeholder="Ej: Repuestos Caracas C.A." required />
            </Field>
            <Field label="Cédula / RIF" htmlFor="rif" error={errors.rif}>
              <DocumentInput
                id="rif"
                prefix={rifTipo}
                onPrefixChange={setRifTipo}
                number={rifNumero}
                onNumberChange={setRifNumero}
                required
                invalid={!!errors.rif}
              />
            </Field>
            <Field label="Teléfono" htmlFor="telefono" error={errors.telefono}>
              <PhoneInput
                id="telefono"
                prefix={tlfPrefijo}
                onPrefixChange={setTlfPrefijo}
                number={tlfNumero}
                onNumberChange={setTlfNumero}
                required
                invalid={!!errors.telefono}
              />
            </Field>
            <Field label="Persona de contacto" htmlFor="contacto">
              <Input id="contacto" name="contacto" defaultValue={proveedor?.contacto ?? ''} placeholder="Ej: Lic. Juan Pérez" />
            </Field>
            <Field label="Correo electrónico" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={proveedor?.email ?? ''}
                placeholder="contacto@empresa.com"
                required
              />
            </Field>
            <Field label="Dirección fiscal" htmlFor="direccion" className="md:col-span-2">
              <Input id="direccion" name="direccion" defaultValue={proveedor?.direccion ?? ''} required />
            </Field>
            <Field label="Ciudad" htmlFor="ciudad">
              <Input id="ciudad" name="ciudad" defaultValue={proveedor?.ciudad ?? ''} required />
            </Field>
            <div className="flex items-end">
              <div className="w-full">
                <Toggle
                  checked={activo}
                  onChange={setActivo}
                  label="Proveedor activo"
                  description="Los inactivos no cuentan en el dashboard"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {proveedor ? 'Guardar cambios' : 'Agregar proveedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
