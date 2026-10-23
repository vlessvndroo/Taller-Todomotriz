import { Wrench } from 'lucide-react';
import { cn } from '../ui/utils';

/** Marca Todomotriz: insignia ámbar + nombre en tipografía condensada */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(0,0,0,0.07)_6px_12px)]" />
        <Wrench className="relative size-5" strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-xl font-bold uppercase tracking-wide">Todomotriz</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">Taller & repuestos</p>
        </div>
      )}
    </div>
  );
}
