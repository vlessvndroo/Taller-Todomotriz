import { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, FileText, Gauge, Loader2, Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Field } from '../components/common/FormFields';
import { Logo } from '../components/layout/Logo';
import { errorMessage } from '../lib/api';

const features = [
  { icon: <Package />, title: 'Inventario al día', text: 'Stock, ubicación y alertas de reposición.' },
  { icon: <FileText />, title: 'Facturación con IVA', text: 'Descuenta el stock al vender.' },
  { icon: <ShieldCheck />, title: 'Roles y permisos', text: 'Administrador, gerente y empleado.' },
];

export function LoginPage() {
  const { login, sessionExpired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // App.tsx muestra el Dashboard en cuanto hay usuario
    } catch (err) {
      setError(errorMessage(err) || 'Credenciales incorrectas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.22),transparent_45%),radial-gradient(circle_at_90%_90%,hsl(var(--primary)/0.12),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:repeating-linear-gradient(135deg,#fff_0_2px,transparent_2px_14px)]" />
        <div className="absolute -bottom-24 -right-24 size-[420px] rounded-full border-[40px] border-primary/10" />
        <div className="absolute -bottom-6 -right-6 size-[260px] rounded-full border-[18px] border-dashed border-primary/15" />

        <Logo className="relative" />

        <div className="relative mt-auto max-w-lg">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            <Gauge className="size-4" /> Sistema de gestión
          </p>
          <h1 className="text-6xl font-bold uppercase leading-[0.9]">
            Tu taller, <span className="text-primary">en marcha.</span>
          </h1>
          <p className="mt-5 text-lg text-sidebar-muted">
            Inventario, facturación, proveedores y usuarios en un solo lugar.
          </p>

          <ul className="mt-10 grid gap-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-primary [&_svg]:size-5">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-sidebar-muted">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />

          <h2 className="text-4xl font-bold uppercase">Iniciar sesión</h2>
          <p className="mt-2 text-muted-foreground">Ingresa con tu cuenta para gestionar el taller.</p>

          {sessionExpired && !error && (
            <div role="status" className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-medium text-warning">
              Tu sesión expiró. Vuelve a iniciar sesión.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Correo electrónico" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="ej: admin@taller.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </Field>

            <Field label="Contraseña" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Conectando...
                </>
              ) : (
                <>
                  Ingresar <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Cuentas de prueba</p>
            <p className="mt-1">
              admin@taller.com · gerente@taller.com · empleado@taller.com
            </p>
            <p className="mt-1">
              Contraseña del sistema: <strong className="text-foreground">password123</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
