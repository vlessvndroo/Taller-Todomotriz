import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../ui/utils';
import { PREFIJOS_TELEFONICOS, TIPOS_DOCUMENTO } from '../../lib/constants';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/** Etiqueta + control + mensaje de error/ayuda */
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Deja solo dígitos (evita "e", "-", "." que acepta un input type=number) */
const onlyDigits = (value: string, max?: number) => value.replace(/\D/g, '').slice(0, max);

interface PrefixedNumberProps {
  prefix: string;
  onPrefixChange: (value: string) => void;
  number: string;
  onNumberChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  id?: string;
}

/** Cédula / RIF: tipo (V, J, E, G) + número */
export function DocumentInput({
  prefix,
  onPrefixChange,
  number,
  onNumberChange,
  placeholder = 'Mínimo 6 dígitos',
  required,
  invalid,
  id,
}: PrefixedNumberProps) {
  return (
    <div className="flex gap-2">
      <Select value={prefix} onValueChange={onPrefixChange}>
        <SelectTrigger className="w-[72px]" aria-label="Tipo de documento">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIPOS_DOCUMENTO.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        inputMode="numeric"
        placeholder={placeholder}
        value={number}
        onChange={(e) => onNumberChange(onlyDigits(e.target.value, 10))}
        required={required}
        aria-invalid={invalid || undefined}
        className="tabular flex-1"
      />
    </div>
  );
}

/** Teléfono venezolano: código de área + 7 dígitos */
export function PhoneInput({
  prefix,
  onPrefixChange,
  number,
  onNumberChange,
  placeholder = '1234567',
  required,
  invalid,
  id,
}: PrefixedNumberProps) {
  return (
    <div className="flex gap-2">
      <Select value={prefix} onValueChange={onPrefixChange}>
        <SelectTrigger className="w-[96px]" aria-label="Código de área">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PREFIJOS_TELEFONICOS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        inputMode="numeric"
        placeholder={placeholder}
        value={number}
        onChange={(e) => onNumberChange(onlyDigits(e.target.value, 7))}
        required={required}
        aria-invalid={invalid || undefined}
        className="tabular flex-1"
      />
    </div>
  );
}

/** Botón de icono para acciones de fila con texto accesible */
export function RowAction({
  label,
  tone = 'default',
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string; tone?: 'default' | 'success' | 'danger' | 'info' }) {
  const tones = {
    default: 'hover:bg-muted hover:text-foreground',
    success: 'hover:bg-success/10 hover:text-success',
    danger: 'hover:bg-destructive/10 hover:text-destructive',
    info: 'hover:bg-info/10 hover:text-info',
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors [&_svg]:size-4',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
