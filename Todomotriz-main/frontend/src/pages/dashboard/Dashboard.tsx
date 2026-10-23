import React from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, FileText, Package, Truck, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiData } from '../../lib/useApiData';
import { formatDate, formatMoney, isSameLocalDay, isSameLocalMonth, parseApiDate } from '../../lib/format';
import type { Factura, ProductoInventario, Proveedor, User } from '../../types';
import type { ViewId } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/common/PageHeader';
import { Panel, PanelHeader } from '../../components/common/Panel';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { StatusBadge } from '../../components/common/StatusBadge';
import { cn } from '../../components/ui/utils';
import { SalesChart, type DaySales } from './SalesChart';
import { EstadoFacturaBadge } from '../facturacion/EstadoFacturaBadge';

interface DashboardData extends Record<string, unknown> {
  productos: ProductoInventario[];
  facturas: Factura[];
  proveedores: Proveedor[];
  usuarios: User[];
}

export function Dashboard({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { user, permissions } = useAuth();
  const { data, loading, error, reload } = useApiData<DashboardData>({
    productos: '/products',
    facturas: '/invoices',
    proveedores: '/suppliers',
    usuarios: '/users',
  });

  if (loading) return <LoadingState label="Cargando dashboard..." />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const { productos, facturas, proveedores, usuarios } = data;
  const now = new Date();
  const pagadas = facturas.filter((f) => f.estado === 'pagada');

  const stockBajo = productos
    .filter((p) => p.cantidad <= p.stockMinimo)
    .sort((a, b) => a.cantidad / (a.stockMinimo || 1) - b.cantidad / (b.stockMinimo || 1));
  const pendientes = facturas.filter((f) => f.estado === 'pendiente');
  const porCobrar = pendientes.reduce((acc, f) => acc + f.total, 0);

  const facturasMes = facturas.filter((f) => isSameLocalMonth(parseApiDate(f.fecha), now));
  const cobradoMes = facturasMes.filter((f) => f.estado === 'pagada').reduce((acc, f) => acc + f.total, 0);

  // Ventas pagadas de los últimos 7 días (hora local)
  const ultimos7: DaySales[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const delDia = pagadas.filter((f) => isSameLocalDay(parseApiDate(f.fecha), date));
    return { date, total: delDia.reduce((acc, f) => acc + f.total, 0), count: delDia.length };
  });
  const hoy = ultimos7[6];
  const semana = ultimos7.reduce((acc, d) => acc + d.total, 0);

  const recientes = [...facturas]
    .sort((a, b) => parseApiDate(b.fecha).getTime() - parseApiDate(a.fecha).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: 'Productos en inventario',
      value: productos.length,
      detail: `${productos.reduce((acc, p) => acc + p.cantidad, 0)} unidades en stock`,
      icon: <Package />,
      view: 'inventario' as const,
      allowed: permissions.inventario.ver,
    },
    {
      label: 'Facturas del mes',
      value: facturasMes.length,
      detail: `${formatMoney(cobradoMes)} cobrados`,
      icon: <FileText />,
      view: 'facturacion' as const,
      allowed: permissions.facturacion.ver,
    },
    {
      label: 'Proveedores activos',
      value: proveedores.filter((p) => p.activo).length,
      detail: `de ${proveedores.length} registrados`,
      icon: <Truck />,
      view: 'proveedores' as const,
      allowed: permissions.proveedores.ver,
    },
    {
      label: 'Usuarios activos',
      value: usuarios.filter((u) => u.activo).length,
      detail: `de ${usuarios.length} registrados`,
      icon: <Users />,
      view: 'usuarios' as const,
      allowed: permissions.usuarios.ver,
    },
  ];

  const firstName = user?.nombre.split(' ')[0] ?? '';
  const today = now.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={today} title={`Hola, ${firstName}`} description="Este es el estado del taller hoy." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} onClick={s.allowed ? () => onNavigate(s.view) : undefined} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Ventas */}
        <Panel className="overflow-hidden xl:col-span-2">
          <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col justify-between gap-6 rounded-xl bg-sidebar p-5 text-sidebar-foreground">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ventas del día</p>
                <p className="tabular mt-2 font-display text-4xl font-bold">{formatMoney(hoy.total)}</p>
                <p className="mt-1 text-sm text-sidebar-muted">Total de ventas pagadas hoy · {hoy.count} factura(s)</p>
              </div>
              <div className="border-t border-sidebar-border pt-4">
                <p className="text-xs uppercase tracking-wider text-sidebar-muted">Últimos 7 días</p>
                <p className="tabular font-display text-2xl font-bold">{formatMoney(semana)}</p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Ventas pagadas por día</p>
              <p className="mb-2 text-xs text-muted-foreground">Últimos 7 días</p>
              <SalesChart days={ultimos7} />
            </div>
          </div>
        </Panel>

        {/* Facturas pendientes */}
        <Panel className="flex flex-col">
          <PanelHeader
            icon={<Clock className="size-4" />}
            title="Facturas pendientes"
            description={`${pendientes.length} factura(s) pendientes de pago`}
          />
          {pendientes.length === 0 ? (
            <EmptyState icon={<CheckCircle2 />} title="Todo cobrado" description="No hay facturas pendientes de pago." />
          ) : (
            <>
              <ul className="flex-1 divide-y">
                {pendientes.slice(0, 5).map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{f.cliente}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.numeroFactura} · {formatDate(f.fecha)}
                      </p>
                    </div>
                    <p className="tabular text-sm font-semibold">{formatMoney(f.total)}</p>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t bg-muted/40 px-5 py-3 text-sm">
                <span className="text-muted-foreground">Por cobrar</span>
                <span className="tabular font-display text-xl font-bold">{formatMoney(porCobrar)}</span>
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Stock bajo */}
        <Panel>
          <PanelHeader
            icon={<AlertTriangle className="size-4" />}
            title="Productos con stock bajo"
            description={`${stockBajo.length} producto(s) requieren reabastecimiento`}
            actions={
              stockBajo.length > 0 && <StatusBadge tone="warning">{stockBajo.length} alerta(s)</StatusBadge>
            }
          />
          {stockBajo.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title="Inventario en orden"
              description="Todos los productos están por encima de su stock mínimo."
            />
          ) : (
            <ul className="divide-y">
              {stockBajo.map((p) => {
                const pct = Math.min(100, (p.cantidad / (p.stockMinimo || 1)) * 100);
                return (
                  <li key={p.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Código: {p.codigo} · {p.proveedor || 'Sin proveedor'}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-right text-sm">
                        <span className="font-semibold text-destructive">{p.cantidad}</span>
                        <span className="text-muted-foreground"> / mín. {p.stockMinimo}</span>
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-destructive" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Últimas facturas */}
        <Panel>
          <PanelHeader
            icon={<FileText className="size-4" />}
            title="Últimas facturas"
            description="Movimientos más recientes"
            actions={
              permissions.facturacion.ver && (
                <button
                  onClick={() => onNavigate('facturacion')}
                  className="flex items-center gap-1 text-sm font-semibold text-warning hover:underline"
                >
                  Ver todas <ArrowUpRight className="size-4" />
                </button>
              )
            }
          />
          {recientes.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aún no hay facturas" />
          ) : (
            <ul className="divide-y">
              {recientes.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {f.numeroFactura} <span className="font-normal text-muted-foreground">· {f.cliente}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(f.fecha)}
                      {f.vehiculo ? ` · ${f.vehiculo}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="tabular text-sm font-semibold">{formatMoney(f.total)}</p>
                    <EstadoFacturaBadge estado={f.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

function StatTile({ label, value, detail, icon, onClick }: StatTileProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-sm transition-all sm:p-5',
        onClick && 'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{label}</p>
        <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-warning sm:flex [&_svg]:size-5">
          {icon}
        </div>
      </div>
      <p className="tabular mt-3 font-display text-4xl font-bold leading-none sm:text-5xl">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{detail}</p>
    </Comp>
  );
}
