import { useState } from 'react';
import { Building2, Mail, MapPin, Pencil, Phone, Plus, Trash2, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../components/feedback/FeedbackProvider';
import { useApiData } from '../../lib/useApiData';
import { api, errorMessage } from '../../lib/api';
import { matches } from '../../lib/format';
import type { Proveedor } from '../../types';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { Panel } from '../../components/common/Panel';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { FilterTabs, SearchInput, Toolbar } from '../../components/common/Toolbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RowAction } from '../../components/common/FormFields';
import { ProveedorFormDialog, type ProveedorPayload } from './ProveedorFormDialog';

type Filtro = 'todos' | 'activos' | 'inactivos';

export function ProveedoresView() {
  const { permissions } = useAuth();
  const { toast, confirm } = useFeedback();
  const { data, setData, loading, error, reload } = useApiData<{ proveedores: Proveedor[] }>({ proveedores: '/suppliers' });

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);

  if (loading) return <LoadingState label="Cargando proveedores..." />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const proveedores = data.proveedores;
  const setProveedores = (next: Proveedor[]) => setData({ proveedores: next });
  const activos = proveedores.filter((p) => p.activo).length;

  const visibles = proveedores.filter(
    (p) =>
      (filtro === 'todos' || (filtro === 'activos') === p.activo) &&
      matches(search, p.nombre, p.rif, p.email, p.contacto, p.ciudad),
  );

  const showActions = permissions.proveedores.editar || permissions.proveedores.eliminar;

  const openDialog = (proveedor?: Proveedor) => {
    setEditing(proveedor ?? null);
    setDialogOpen(true);
  };

  const handleSave = async (payload: ProveedorPayload) => {
    try {
      if (editing) {
        await api(`/suppliers/${editing.id}`, 'PUT', payload);
        const updated = await api<Proveedor>(`/suppliers/${editing.id}`);
        setProveedores(proveedores.map((p) => (p.id === editing.id ? updated : p)));
        toast('Proveedor actualizado con éxito');
      } else {
        const created = await api<Proveedor>('/suppliers', 'POST', payload);
        setProveedores([created, ...proveedores]);
        toast('Proveedor registrado con éxito');
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      toast(`Error al guardar: ${errorMessage(err)}`, 'error');
    }
  };

  const handleDelete = async (proveedor: Proveedor) => {
    const ok = await confirm({
      title: '¿Eliminar este proveedor?',
      description: `"${proveedor.nombre}" se eliminará del directorio. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/suppliers/${proveedor.id}`, 'DELETE');
      setProveedores(proveedores.filter((p) => p.id !== proveedor.id));
      toast('Proveedor eliminado');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compras"
        title="Proveedores"
        description="Directorio de proveedores y contactos"
        actions={
          permissions.proveedores.crear && (
            <Button onClick={() => openDialog()}>
              <Plus className="size-4" /> Agregar proveedor
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
              { value: 'todos', label: 'Todos', count: proveedores.length },
              { value: 'activos', label: 'Activos', count: activos },
              { value: 'inactivos', label: 'Inactivos', count: proveedores.length - activos },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, RIF o email..." />
        </Toolbar>

        {visibles.length === 0 ? (
          <EmptyState
            icon={<Truck />}
            title={proveedores.length === 0 ? 'Aún no hay proveedores' : 'Sin resultados'}
            description={proveedores.length === 0 ? 'Registra tu primer proveedor.' : 'Prueba con otra búsqueda o filtro.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Empresa / Nombre</TableHead>
                <TableHead>Cédula / RIF</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                {showActions && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-warning">
                        <Building2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{p.nombre}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3" /> {p.email || 'Sin email'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">{p.rif}</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{p.contacto || '—'}</p>
                    <p className="tabular flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3" /> {p.telefono}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 text-sm">
                      <MapPin className="size-3.5 text-muted-foreground" /> {p.ciudad}
                    </p>
                    <p className="max-w-[180px] truncate text-xs text-muted-foreground" title={p.direccion}>
                      {p.direccion}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={p.activo ? 'success' : 'neutral'}>{p.activo ? 'Activo' : 'Inactivo'}</StatusBadge>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {permissions.proveedores.editar && (
                          <RowAction label="Editar" tone="info" onClick={() => openDialog(p)}>
                            <Pencil />
                          </RowAction>
                        )}
                        {permissions.proveedores.eliminar && (
                          <RowAction label="Eliminar" tone="danger" onClick={() => handleDelete(p)}>
                            <Trash2 />
                          </RowAction>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          Mostrando {visibles.length} de {proveedores.length} proveedores
        </p>
      </Panel>

      <ProveedorFormDialog open={dialogOpen} onOpenChange={setDialogOpen} proveedor={editing} onSave={handleSave} />
    </div>
  );
}
