import { useState } from 'react';
import { Check, Pencil, Phone, Plus, Shield, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../components/feedback/FeedbackProvider';
import { useApiData } from '../../lib/useApiData';
import { api, errorMessage } from '../../lib/api';
import { initials, matches } from '../../lib/format';
import { ROLES } from '../../lib/constants';
import type { User, UserRole } from '../../types';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { Panel, PanelHeader } from '../../components/common/Panel';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { FilterTabs, SearchInput, Toolbar } from '../../components/common/Toolbar';
import { StatusBadge, type Tone } from '../../components/common/StatusBadge';
import { RowAction } from '../../components/common/FormFields';
import { cn } from '../../components/ui/utils';
import { UsuarioFormDialog, type UsuarioPayload } from './UsuarioFormDialog';

const rolTone: Record<UserRole, Tone> = { admin: 'danger', gerente: 'info', empleado: 'success' };

export function RolBadge({ rol }: { rol: UserRole }) {
  return (
    <StatusBadge tone={rolTone[rol]} dot={false}>
      {ROLES[rol].label}
    </StatusBadge>
  );
}

type Filtro = 'todos' | UserRole;

export function UsuariosView() {
  const { user: currentUser, permissions } = useAuth();
  const { toast, confirm } = useFeedback();
  const { data, setData, loading, error, reload } = useApiData<{ usuarios: User[] }>({ usuarios: '/users' });

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  if (loading) return <LoadingState label="Cargando usuarios..." />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const usuarios = data.usuarios;
  const setUsuarios = (next: User[]) => setData({ usuarios: next });
  const isSelf = (u: User) => u.id === currentUser?.id;
  const count = (rol: UserRole) => usuarios.filter((u) => u.rol === rol).length;

  const visibles = usuarios.filter(
    (u) => (filtro === 'todos' || u.rol === filtro) && matches(search, u.nombre, u.email, u.rol, ROLES[u.rol]?.label),
  );

  const showActions = permissions.usuarios.editar || permissions.usuarios.eliminar;

  const openDialog = (usuario?: User) => {
    setEditing(usuario ?? null);
    setDialogOpen(true);
  };

  const handleSave = async (payload: UsuarioPayload) => {
    try {
      if (editing) {
        await api(`/users/${editing.id}`, 'PUT', payload);
        const updated = await api<User>(`/users/${editing.id}`);
        setUsuarios(usuarios.map((u) => (u.id === editing.id ? updated : u)));
        toast('Usuario modificado correctamente');
      } else {
        const created = await api<User>('/users', 'POST', payload);
        setUsuarios([created, ...usuarios]);
        toast('Usuario creado correctamente');
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      toast(`Error al guardar: ${errorMessage(err)}`, 'error');
    }
  };

  const toggleActivo = async (usuario: User) => {
    const updated = { ...usuario, activo: !usuario.activo };
    try {
      // Sin contraseña: el backend conserva la actual
      await api(`/users/${usuario.id}`, 'PUT', { ...updated, password: null });
      setUsuarios(usuarios.map((u) => (u.id === usuario.id ? updated : u)));
      toast(`${usuario.nombre} ahora está ${updated.activo ? 'activo' : 'inactivo'}`);
    } catch (err) {
      toast(`No se pudo cambiar el estado: ${errorMessage(err)}`, 'error');
    }
  };

  const handleDelete = async (usuario: User) => {
    const ok = await confirm({
      title: '¿Eliminar este usuario?',
      description: `${usuario.nombre} (${usuario.email}) perderá el acceso al sistema. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/users/${usuario.id}`, 'DELETE');
      setUsuarios(usuarios.filter((u) => u.id !== usuario.id));
      toast('Usuario eliminado');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accesos"
        title="Usuarios"
        description="Administra los usuarios del sistema y sus roles"
        actions={
          permissions.usuarios.crear && (
            <Button onClick={() => openDialog()}>
              <Plus className="size-4" /> Agregar usuario
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
              { value: 'todos', label: 'Todos', count: usuarios.length },
              { value: 'admin', label: 'Admin', count: count('admin') },
              { value: 'gerente', label: 'Gerentes', count: count('gerente') },
              { value: 'empleado', label: 'Empleados', count: count('empleado') },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, email o rol..." />
        </Toolbar>

        {visibles.length === 0 ? (
          <EmptyState icon={<Users />} title="Sin resultados" description="Prueba con otra búsqueda o filtro." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                {showActions && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((u) => {
                const canToggle = permissions.usuarios.editar && !isSelf(u);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold',
                            u.activo ? 'bg-primary/20 text-foreground' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {initials(u.nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {u.nombre} {isSelf(u) && <span className="text-xs font-normal text-muted-foreground">(tú)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="tabular flex items-center gap-1.5 text-sm text-muted-foreground">
                        {u.telefono ? (
                          <>
                            <Phone className="size-3" /> {u.telefono}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RolBadge rol={u.rol} />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        disabled={!canToggle}
                        onClick={() => toggleActivo(u)}
                        title={canToggle ? 'Clic para cambiar el estado' : undefined}
                        className="rounded-full disabled:cursor-default enabled:hover:opacity-80"
                      >
                        <StatusBadge tone={u.activo ? 'success' : 'neutral'}>{u.activo ? 'Activo' : 'Inactivo'}</StatusBadge>
                      </button>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {permissions.usuarios.editar && (
                            <RowAction label="Editar" tone="info" onClick={() => openDialog(u)}>
                              <Pencil />
                            </RowAction>
                          )}
                          {permissions.usuarios.eliminar && !isSelf(u) && (
                            <RowAction label="Eliminar" tone="danger" onClick={() => handleDelete(u)}>
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
      </Panel>

      <Panel>
        <PanelHeader icon={<Shield className="size-4" />} title="Roles y permisos del sistema" />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {(Object.keys(ROLES) as UserRole[]).map((rol) => (
            <div key={rol} className="rounded-xl border bg-muted/30 p-4">
              <RolBadge rol={rol} />
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {ROLES[rol].permisos.map((permiso) => (
                  <li key={permiso} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {permiso}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      <UsuarioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={editing}
        isSelf={!!editing && isSelf(editing)}
        onSave={handleSave}
      />
    </div>
  );
}
