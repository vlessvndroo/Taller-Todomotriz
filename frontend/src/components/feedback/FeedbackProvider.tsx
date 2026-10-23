import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

// Reemplaza alert() y confirm() del navegador por avisos y diálogos con el estilo de la app.

type ToastTone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
}

interface FeedbackContextType {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const toastStyles: Record<ToastTone, { icon: React.ReactNode; className: string }> = {
  success: { icon: <CheckCircle2 className="size-5 text-success" />, className: 'border-success/30' },
  error: { icon: <XCircle className="size-5 text-destructive" />, className: 'border-destructive/30' },
  info: { icon: <Info className="size-5 text-info" />, className: 'border-info/30' },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = ++nextId.current;
      setToasts((all) => [...all, { id, tone, message }]);
      setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const closeConfirm = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="no-print fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'flex animate-toast-in items-start gap-3 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-xl',
              toastStyles[t.tone].className,
            )}
          >
            {toastStyles[t.tone].icon}
            <p className="flex-1 pt-0.5 font-medium">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-md p-0.5 text-muted-foreground hover:bg-muted"
              aria-label="Cerrar aviso"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!confirmState} onOpenChange={(open) => !open && closeConfirm(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div
              className={cn(
                'mb-2 flex size-11 items-center justify-center rounded-full',
                confirmState?.tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/15 text-warning',
              )}
            >
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>{confirmState?.title}</DialogTitle>
            {confirmState?.description && <DialogDescription>{confirmState.description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => closeConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant={confirmState?.tone === 'danger' ? 'destructive' : 'default'}
              onClick={() => closeConfirm(true)}
              autoFocus
            >
              {confirmState?.confirmLabel ?? 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback debe usarse dentro de un FeedbackProvider');
  return context;
}
