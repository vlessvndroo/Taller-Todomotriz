import { useState } from 'react';
import { AlertTriangle, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../components/feedback/FeedbackProvider';
import { useApiData } from '../../lib/useApiData';
import { api, errorMessage } from '../../lib/api';
import { formatMoney, matches } from '../../lib/format';
import { CATEGORIAS_PRODUCTO } from '../../lib/constants';
import type { ProductoInventario, Proveedor } from '../../types';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageHeader } from '../../components/common/PageHeader';
import { Panel } from '../../components/common/Panel';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { FilterTabs, SearchInput, Toolbar } from '../../components/common/Toolbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RowAction } from '../../components/common/FormFields';
import { ProductoFormDialog, type ProductoPayload } from './ProductoFormDialog';

type Filtro = 'todos' | 'bajo';
const ALL = '__all__';

export function InventarioView() {
  const { permissions } = useAuth();
  const { toast, confirm } = useFeedback();
  const { data, setData, loading, error, reload } = useApiData<{ productos: ProductoInventario[]; proveedores: Proveedor[] }>({
    productos: '/products',
    proveedores: '/suppliers',
  });

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [categoria, setCategoria] = useState(ALL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductoInventario | null>(null);

  if (loading) return <LoadingState label="Cargando inventario..." />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const productos = data.productos;
  const setProductos = (next: ProductoInventario[]) => setData({ ...data, productos: next });
  const esBajo = (p: ProductoInventario) => p.cantidad <= p.stockMinimo;
  const stockBajo = productos.filter(esBajo).length;
  const valorCosto = productos.reduce((acc, p) => acc + p.cantidad * p.precioCompra, 0);
  const valorVenta = productos.reduce((acc, p) => acc + p.cantidad * p.precioVenta, 0);

  const visibles = productos.filter(
    (p) =>
      (filtro === 'todos' || esBajo(p)) &&
      (categoria === ALL || p.categoria === categoria) &&
      matches(search, p.nombre, p.codigo, p.categoria),
  );

  const showActions = permissions.inventario.editar || permissions.inventario.eliminar;

  const openDialog = (producto?: ProductoInventario) => {
    setEditing(producto ?? null);
    setDialogOpen(true);
  };

  const handleSave = async (payload: ProductoPayload) => {
    try {
      if (editing) {
        await api(`/products/${editing.id}`, 'PUT', payload);
        const updated = await api<ProductoInventario>(`/products/${editing.id}`);
        setProductos(productos.map((p) => (p.id === editing.id ? updated : p)));
        toast('Producto actualizado correctamente');
      } else {
        const created = await api<ProductoInventario>('/products', 'POST', payload);
        setProductos([created, ...productos]);
        toast('Producto agregado al inventario');
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      toast(`Error al guardar: ${errorMessage(err)}`, 'error');
    }
  };

  const handleDelete = async (producto: ProductoInventario) => {
    const ok = await confirm({
      title: '¿Eliminar este producto?',
      description: `"${producto.nombre}" se eliminará del inventario. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/products/${producto.id}`, 'DELETE');
      setProductos(productos.filter((p) => p.id !== producto.id));
      toast('Producto eliminado');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Almacén"
        title="Inventario"
        description="Administra los productos y repuestos del taller"
        actions={
          permissions.inventario.crear && (
            <Button onClick={() => openDialog()}>
              <Plus className="size-4" /> Agregar producto
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Summary label="Productos" value={String(productos.length)} />
        <Summary label="Stock bajo" value={String(stockBajo)} tone={stockBajo > 0 ? 'danger' : undefined} />
        <Summary label="Valor al costo" value={formatMoney(valorCosto)} />
        <Summary label="Valor de venta" value={formatMoney(valorVenta)} />
      </div>

      <Panel className="overflow-hidden">
        <Toolbar>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FilterTabs
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: 'todos', label: 'Todos', count: productos.length },
                { value: 'bajo', label: 'Stock bajo', count: stockBajo },
              ]}
            />
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="sm:w-48" aria-label="Filtrar por categoría">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las categorías</SelectItem>
                {CATEGORIAS_PRODUCTO.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, código o categoría..." />
        </Toolbar>

        {visibles.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={productos.length === 0 ? 'El inventario está vacío' : 'Sin resultados'}
            description={productos.length === 0 ? 'Agrega tu primer producto para empezar.' : 'Prueba con otra búsqueda o filtro.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead className="text-right">Precio venta</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                {showActions && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((p) => {
                const bajo = esBajo(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">{p.codigo}</span>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate font-semibold" title={p.nombre}>{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.ubicacion}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.categoria || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`tabular font-semibold ${bajo ? 'text-destructive' : ''}`}>{p.cantidad}</span>
                        {bajo && <AlertTriangle className="size-4 text-warning" aria-label="Stock bajo" />}
                      </div>
                      <p className="text-xs text-muted-foreground">mín. {p.stockMinimo}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="tabular font-semibold">{formatMoney(p.precioVenta)}</p>
                      <p className="tabular text-xs text-muted-foreground">costo {formatMoney(p.precioCompra)}</p>
                    </TableCell>
                    <TableCell className="text-sm">{p.proveedor || '—'}</TableCell>
                    <TableCell>
                      {bajo ? <StatusBadge tone="danger">Stock bajo</StatusBadge> : <StatusBadge tone="success">Disponible</StatusBadge>}
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {permissions.inventario.editar && (
                            <RowAction label="Editar" tone="info" onClick={() => openDialog(p)}>
                              <Pencil />
                            </RowAction>
                          )}
                          {permissions.inventario.eliminar && (
                            <RowAction label="Eliminar" tone="danger" onClick={() => handleDelete(p)}>
                              <Trash2 />
                            </RowAction>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          Mostrando {visibles.length} de {productos.length} productos
        </p>
      </Panel>

      <ProductoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        producto={editing}
        proveedores={data.proveedores}
        onSave={handleSave}
      />
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`tabular mt-1 font-display text-2xl font-bold ${tone === 'danger' ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}
