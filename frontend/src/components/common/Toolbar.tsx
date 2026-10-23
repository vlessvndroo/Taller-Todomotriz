import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Limpiar búsqueda"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Filtros rápidos tipo "pestañas" (Todos / Stock bajo / ...) */
export function FilterTabs<T extends string>({ options, value, onChange }: FilterTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
            value === opt.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              className={cn(
                'tabular rounded-full px-1.5 text-xs',
                value === opt.value ? 'bg-primary text-primary-foreground' : 'bg-background',
              )}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Contenedor de búsqueda + filtros encima de cada tabla */
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between', className)}>
      {children}
    </div>
  );
}
