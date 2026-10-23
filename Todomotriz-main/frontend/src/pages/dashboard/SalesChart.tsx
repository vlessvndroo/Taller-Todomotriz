import { formatMoney } from '../../lib/format';
import { cn } from '../../components/ui/utils';

export interface DaySales {
  date: Date;
  total: number;
  count: number;
}

const dayLabel = (d: Date) => d.toLocaleDateString('es-VE', { weekday: 'short' }).replace('.', '');
const fullLabel = (d: Date) => d.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * Barras de ventas pagadas por día (una sola serie, sin leyenda).
 * Color validado con contraste >= 3:1; el valor del día actual va etiquetado
 * y cada barra muestra su detalle al pasar el mouse o enfocarla.
 */
export function SalesChart({ days }: { days: DaySales[] }) {
  const max = Math.max(...days.map((d) => d.total), 0);
  const lastIndex = days.length - 1;

  return (
    <figure className="flex h-full flex-col">
      <div className="relative flex flex-1 items-end gap-2 border-b border-border pt-8" style={{ minHeight: 160 }}>
        {/* Líneas guía recesivas */}
        <div className="pointer-events-none absolute inset-x-0 top-8 border-t border-dashed border-border/70" />
        <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+16px)] border-t border-dashed border-border/70" />
        {max === 0 && (
          <p className="absolute inset-x-0 top-1/2 text-center text-sm text-muted-foreground">
            Sin ventas pagadas en los últimos 7 días
          </p>
        )}

        {days.map((day, i) => {
          const height = max > 0 ? Math.max((day.total / max) * 100, day.total > 0 ? 3 : 0) : 0;
          const isToday = i === lastIndex;
          return (
            <div
              key={day.date.toISOString()}
              tabIndex={0}
              aria-label={`${fullLabel(day.date)}: ${formatMoney(day.total)}, ${day.count} factura(s)`}
              className="group relative flex h-full flex-1 cursor-default items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-10 hidden w-max -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg group-hover:block group-focus-visible:block">
                <p className="font-semibold capitalize">{fullLabel(day.date)}</p>
                <p className="tabular mt-0.5 text-muted-foreground">
                  {formatMoney(day.total)} · {day.count} factura(s)
                </p>
              </div>

              {isToday && day.total > 0 && (
                <span
                  className="tabular absolute text-xs font-semibold text-foreground"
                  style={{ bottom: `calc(${height}% + 4px)` }}
                >
                  {formatMoney(day.total)}
                </span>
              )}
              <div
                className={cn(
                  'w-full max-w-[28px] rounded-t-[4px] bg-chart transition-opacity',
                  'group-hover:opacity-80',
                )}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {days.map((day, i) => (
          <span
            key={day.date.toISOString()}
            className={cn(
              'flex-1 text-center text-xs capitalize',
              i === lastIndex ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {i === lastIndex ? 'Hoy' : dayLabel(day.date)}
          </span>
        ))}
      </div>

      {/* Vista de tabla para lectores de pantalla */}
      <table className="sr-only">
        <caption>Ventas pagadas de los últimos 7 días</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.date.toISOString()}>
              <th>{fullLabel(d.date)}</th>
              <td>{formatMoney(d.total)}</td>
              <td>{d.count} facturas</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
