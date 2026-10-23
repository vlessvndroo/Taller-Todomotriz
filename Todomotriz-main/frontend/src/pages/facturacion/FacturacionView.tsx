import { useState } from 'react';
import { Ban, DollarSign, Eye, FileText, Pencil, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../components/feedback/FeedbackProvider';
import { useApiData } from '../../lib/useApiData';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatMoney, matches, parseApiDate } from '../../lib/format';
import type { Factura, ProductoInventario } from '../../types';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { Panel } from '../../components/common/Panel';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { FilterTabs, SearchInput, Toolbar } from '../../components/common/Toolbar';
import { RowAction } from '../../components/common/FormFields';
import { EstadoFacturaBadge } from './EstadoFacturaBadge';
import { FacturaDetailDialog } from './FacturaDetailDialog';
import { FacturaFormDialog, type FacturaFormValues } from './FacturaFormDialog';
import { calcularTotales, siguienteNumeroFactura } from './facturas';

type Filtro = 'todas' | Factura['estado'];

export function FacturacionView() {
  const { permissions, user } = useAuth();
  const { toast, confirm } = useFeedback();
  const { data, setData, loading, error, reload } = useApiData<{ facturas: Factura[]; productos: ProductoInventario[] }>({
    facturas: '/invoices',
    productos: '/products',
  });

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [viewing, setViewing] = useState<Factura | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Factura | null>(null);

  if (loading) return <LoadingState label="Cargando facturación..." />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const { facturas, productos } = data;
  const update = (patch: Partial<typeof data>) => setData({ ...data, ...patch });
  const refreshProductos = async () => {
    const productos = await api<ProductoInventario[]>('/products');
    setData((prev) => (prev ? { ...prev, productos } : prev));
  };

  const count = (estado: Factura['estado']) => facturas.filter((f) => f.estado === estado).length;
  const visibles = facturas
    .filter((f) => (filtro === 'todas' || f.estado === filtro) && matches(search, f.numeroFactura, f.cliente, f.placa, f.clienteCedula))
    .sort((a, b) => parseApiDate(b.fecha).getTime() - parseApiDate(a.fecha).getTime());

  // El listado no trae los items: se pide la factura completa antes de verla o editarla
  const fetchCompleta = (id: string) => api<Factura>(`/invoices/${id}`);

  const handleView = async (factura: Factura) => {
    try {
      setViewing(await fetchCompleta(factura.id));
    } catch {
      setViewing(factura);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
    refreshProductos().catch(() => undefined);
  };

  const openEdit = async (factura: Factura) => {
    try {
      const [completa] = await Promise.all([fetchCompleta(factura.id), refreshProductos()]);
      setEditing(completa);
      setFormOpen(true);
    } catch (err) {
      toast(`No se pudo cargar la factura: ${errorMessage(err)}`, 'error');
    }
  };

  const handleSave = async (values: FacturaFormValues) => {
    const { subtotal, iva, total } = calcularTotales(values.items);
    const payload = {
      numeroFactura: editing ? editing.numeroFactura : siguienteNumeroFactura(facturas),
      fecha: editing ? editing.fecha : new Date().toISOString(),
      ...values,
      items: values.items.map(({ productoId, producto, cantidad, precioUnitario, subtotal }) => ({
        productoId,
        producto,
        cantidad,
        precioUnitario,
        subtotal,
      })),
      subtotal,
      iva,
      total,
      estado: editing ? editing.estado : 'pendiente',
      creadoPor: editing ? editing.creadoPor : user?.nombre || '',
    };

    try {
      if (editing) {
        await api(`/invoices/${editing.id}`, 'PUT', { ...payload, id: editing.id });
        update({ facturas: facturas.map((f) => (f.id === editing.id ? ({ ...editing, ...payload } as Factura) : f)) });
        toast('Factura actualizada');
      } else {
        const created = await api<Factura>('/invoices', 'POST', payload);
        update({ facturas: [created, ...facturas] });
        toast(`Factura ${created.numeroFactura} creada exitosamente`);
      }
      setFormOpen(false);
      setEditing(null);
      await refreshProductos();
    } catch (err) {
      toast(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  const updateEstado = async (factura: Factura, estado: 'pagada' | 'anulada') => {
    const ok = await confirm(
      estado === 'pagada'
        ? {
            title: '¿Confirmar pago?',
            description: `Se registrará el pago de ${factura.numeroFactura} por ${formatMoney(factura.total)}.`,
            confirmLabel: 'Registrar pago',
          }
        : {
            title: '¿Anular factura?',
            description: `${factura.numeroFactura} quedará anulada y sus productos volverán al inventario.`,
            confirmLabel: 'Anular factura',
            tone: 'danger',
          },
    );
    if (!ok) return;

    try {
      const completa = await fetchCompleta(factura.id);
      await api(`/invoices/${factura.id}`, 'PUT', { ...completa, estado });
      update({ facturas: facturas.map((f) => (f.id === factura.id ? { ...f, estado } : f)) });
      toast(`Factura ${estado === 'pagada' ? 'PAGADA' : 'ANULADA'} correctamente.`);
      if (estado === 'anulada') await refreshProductos();
    } catch (err) {
      toast(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  const porCobrar = facturas.filter((f) => f.estado === 'pendiente').reduce((acc, f) => acc + f.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ventas"
        title="Facturación"
        description={
          <>
            Administra facturas, pagos y ventas. Por cobrar:{' '}
            <strong className="tabular text-foreground">{formatMoney(porCobrar)}</strong>
          </>
        }
        actions={
          permissions.facturacion.crear && (
            <Button onClick={openNew}>
              <Plus className="size-4" /> Nueva factura
            </Button>
          )
        }
      />

      <Panel className="overflow-hidden">
        <Toolbar>
          <FilterTabs
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: 'todas', label: 'Todas', count: facturas.length },
              { value: 'pendiente', label: 'Pendientes', count: count('pendiente') },
              { value: 'pagada', label: 'Pagadas', count: count('pagada') },
              { value: 'anulada', label: 'Anuladas', count: count('anulada') },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por número, cliente o placa..." />
        </Toolbar>

        {visibles.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title={facturas.length === 0 ? 'Aún no hay facturas' : 'Sin resultados'}
            description={facturas.length === 0 ? 'Crea la primera venta con "Nueva factura".' : 'Prueba con otra búsqueda o filtro.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((f) => {
                const pendiente = f.estado === 'pendiente';
                return (
                  <TableRow key={f.id}>
                    <TableCell>
                      <button onClick={() => handleView(f)} className="font-mono text-sm font-semibold hover:text-warning hover:underline">
                        {f.numeroFactura}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(f.fecha)}</TableCell>
                    <TableCell>
                      <p className="font-semibold">{f.cliente}</p>
                      <p className="text-xs text-muted-foreground">{f.clienteCedula}</p>
                    </TableCell>
                    <TableCell>
                      <p>{f.vehiculo || '—'}</p>
                      {f.placa && (
                        <span className="mt-0.5 inline-block rounded border border-foreground/20 bg-muted px-1.5 font-mono text-[11px] font-semibold uppercase">
                          {f.placa}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right font-semibold">{formatMoney(f.total)}</TableCell>
                    <TableCell>
                      <EstadoFacturaBadge estado={f.estado} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <RowAction label="Ver detalle" onClick={() => handleView(f)}>
                          <Eye />
                        </RowAction>
                        {pendiente && permissions.facturacion.editar && (
                          <>
                            <RowAction label="Modificar" tone="info" onClick={() => openEdit(f)}>
                              <Pencil />
                            </RowAction>
                            <RowAction label="Registrar pago" tone="success" onClick={() => updateEstado(f, 'pagada')}>
                              <DollarSign />
                            </RowAction>
                          </>
                        )}
                        {pendiente && permissions.facturacion.anular && (
                          <RowAction label="Anular" tone="danger" onClick={() => updateEstado(f, 'anulada')}>
                            <Ban />
                          </RowAction>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          Mostrando {visibles.length} de {facturas.length} facturas
        </p>
      </Panel>

      <FacturaFormDialog open={formOpen} onOpenChange={setFormOpen} factura={editing} productos={productos} onSave={handleSave} />
      <FacturaDetailDialog factura={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
