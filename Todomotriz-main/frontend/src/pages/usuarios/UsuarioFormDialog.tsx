import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Field, PhoneInput } from '../../components/common/FormFields';
import { splitPrefixed } from '../../lib/format';
import { Toggle } from '../../components/common/Toggle';
import { ROLES } from '../../lib/constants';
import type { User, UserRole } from '../../types';

export interface UsuarioPayload {
  nombre: string;
  email: string;
  rol: UserRole;
  telefono: string | null;
  /** null = no se cambia */
  password: string | null;
  activo: boolean;
}

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: User | null;
  isSelf: boolean;
  onSave: (payload: UsuarioPayload) => Promise<void>;
}

export function UsuarioFormDialog({ open, onOpenChange, usuario, isSelf, onSave }: UsuarioFormDialogProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tlfPrefijo, setTlfPrefijo] = useState('0412');
  const [tlfNumero, setTlfNumero] = useState('');
  const [activo, setActivo] = useState(true);

  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const [pref, num] = splitPrefixed(usuario?.telefono, '0412');
      setTlfPrefijo(pref);
      setTlfNumero(num);
      setActivo(usuario?.activo ?? true);
      setErrors({});
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = (form.get('password') as string).trim();
    const email = (form.get('email') as string).trim();

    const next: Record<string, string> = {};
    if (!email) next.email = 'Email requerido';
    if (tlfNumero && !/^\d{7}$/.test(tlfNumero)) next.telefono = 'El número debe tener exactamente 7 dígitos';
    if (!usuario && !password) next.password = 'La contraseña es obligatoria para nuevos usuarios';
    else if (password && password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        nombre: (form.get('nombre') as string).trim(),
        email,
        rol: ((form.get('rol') as UserRole | null) ?? usuario?.rol ?? 'empleado'),
        telefono: tlfNumero ? `${tlfPrefijo}-${tlfNumero}` : null,
        password: password || null,
        activo,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{usuario ? 'Editar usuario' : 'Agregar nuevo usuario'}</DialogTitle>
          <DialogDescription>Complete los datos del usuario para el acceso al sistema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre completo" htmlFor="nombre">
            <Input id="nombre" name="nombre" defaultValue={usuario?.nombre} placeholder="Ej: Juan Pérez" required />
          </Field>
          <Field label="Correo electrónico" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={usuario?.email} placeholder="usuario@taller.com" required />
          </Field>
          <Field
            label="Contraseña"
            htmlFor="password"
            error={errors.password}
            hint={usuario ? 'Las contraseñas se guardan cifradas: no se pueden ver, solo reemplazar. Dejar en blanco para no cambiarla.' : 'Mínimo 6 caracteres'}
          >
            <Input
              id="password"
              name="password"
              type="text"
              autoComplete="off"
              placeholder={usuario ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
            />
          </Field>
          <Field label="Teléfono" htmlFor="telefono" error={errors.telefono} hint="Opcional">
            <PhoneInput
              id="telefono"
              prefix={tlfPrefijo}
              onPrefixChange={setTlfPrefijo}
              number={tlfNumero}
              onNumberChange={setTlfNumero}
              invalid={!!errors.telefono}
            />
          </Field>
          <Field label="Rol" hint={isSelf ? 'No puedes cambiar tu propio rol' : undefined}>
            <Select name="rol" defaultValue={usuario?.rol ?? 'empleado'} disabled={isSelf}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLES) as UserRole[]).map((rol) => (
                  <SelectItem key={rol} value={rol}>
                    {ROLES[rol].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {usuario && (
            <Toggle
              checked={activo}
              onChange={setActivo}
              disabled={isSelf}
              label="Usuario activo"
              description={isSelf ? 'No puedes desactivar tu propia cuenta' : 'Los usuarios inactivos no pueden iniciar sesión'}
            />
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {usuario ? 'Guardar cambios' : 'Agregar usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
