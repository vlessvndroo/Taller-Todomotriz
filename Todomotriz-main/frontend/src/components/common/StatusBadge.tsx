import React from 'react';
import { cn } from '../ui/utils';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const tones: Record<Tone, string> = {
  success: 'bg-success/10 text-success ring-success/25',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  danger: 'bg-destructive/10 text-destructive ring-destructive/25',
  info: 'bg-info/10 text-info ring-info/25',
  neutral: 'bg-muted text-muted-foreground ring-border',
  brand: 'bg-primary/15 text-foreground ring-primary/40',
};

interface StatusBadgeProps extends React.ComponentProps<'span'> {
  tone?: Tone;
  dot?: boolean;
}

export function StatusBadge({ tone = 'neutral', dot = true, className, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
