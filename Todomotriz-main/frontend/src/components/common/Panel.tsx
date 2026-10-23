import React from 'react';
import { cn } from '../ui/utils';

/** Superficie base (tarjeta) usada en todas las pantallas */
export function Panel({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('rounded-2xl border bg-card text-card-foreground shadow-sm', className)} {...props} />;
}

interface PanelHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, description, icon, actions, className }: PanelHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b px-5 py-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-warning">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-bold uppercase leading-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
