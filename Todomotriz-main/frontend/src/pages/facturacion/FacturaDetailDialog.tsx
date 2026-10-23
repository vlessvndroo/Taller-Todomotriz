import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Logo } from '../../components/layout/Logo';
import { formatDateTime, formatMoney } from '../../lib/format';
import { IVA_RATE } from '../../lib/constants';
import type { Factura } from '../../types';
import { EstadoFacturaBadge } from './EstadoFacturaBadge';

interface FacturaDetailDialogProps {
  factura: Factura | null;
  onClose: () => void;
}

/** Detalle de factura con formato de comprobante imprimible */
export function FacturaDetailDialog({ factura, onClose }: FacturaDetailDialogProps) {
  return (
    <Dialog open={!!factura} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalle de factura</DialogTitle>
          <DialogDescription>Comprobante de la factura seleccionada</DialogDescription>
        </DialogHeader>

        {factura && (
          <>
            <article className="print-area space-y-6 p-6 sm:p-8">
              <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Logo />
                  <p className="mt-3 text-sm text-muted-foreground">Taller automotriz y venta de repuestos</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Factura</p>
                  <p className="font-display text-3xl font-bold">{factura.numeroFactura}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(factura.fecha)}</p>
                  <div className="mt-2 sm:flex sm:justify-end">
                    <EstadoFacturaBadge estado={factura.estado} />
                  </div>
                </div>
              </header>

              <section className="grid gap-4 text-sm sm:grid-cols-3">
                <InfoBlock title="Cliente">
                  <p className="font-semibold">{factura.cliente}</p>
                  <p className="text-muted-foreground">CI/RIF: {factura.clienteCedula || '—'}</p>
                </InfoBlock>
                <InfoBlock title="Vehículo">
                  <p className="font-semibold">{factura.vehiculo || '—'}</p>
                  <p className="text-muted-foreground">Placa: {factura.placa || '—'}</p>
                </InfoBlock>
                <InfoBlock title="Pago">
                  <p className="font-semibold">{factura.metodoPago || '—'}</p>
                  <p className="text-muted-foreground">Atendido por: {factura.creadoPor || '—'}</p>
                </InfoBlock>
              </section>

              <section className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Producto</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Cant.</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Precio</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {factura.items?.length ? (
                      factura.items.map((i) => (
                        <tr key={i.id}>
                          <td className="px-4 py-2.5">{i.producto}</td>
                          <td className="tabular px-4 py-2.5 text-right">{i.cantidad}</td>
                          <td className="tabular px-4 py-2.5 text-right">{formatMoney(i.precioUnitario)}</td>
                          <td className="tabular px-4 py-2.5 text-right font-semibold">{formatMoney(i.subtotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                          Sin items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-sm text-sm">
                  {factura.observaciones && (
                    <InfoBlock title="Observaciones">
                      <p className="whitespace-pre-line text-muted-foreground">{factura.observaciones}</p>
                    </InfoBlock>
                  )}
                </div>
                <dl className="tabular w-full space-y-1.5 text-sm sm:w-64">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd>{formatMoney(factura.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">IVA ({Math.round(IVA_RATE * 100)}%)</dt>
                    <dd>{formatMoney(factura.iva)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t pt-2">
                    <dt className="font-semibold">Total</dt>
                    <dd className="font-display text-3xl font-bold">{formatMoney(factura.total)}</dd>
                  </div>
                </dl>
              </section>
            </article>

            <div className="no-print flex justify-end gap-2 border-t bg-muted/30 px-6 py-4">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="size-4" /> Imprimir
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
