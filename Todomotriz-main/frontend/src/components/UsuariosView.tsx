import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Search, Pencil, Trash2, Shield } from 'lucide-react';
import { mockUsuarios } from '../data/mockData';
import type { User, UserRole } from '../types';

export function UsuariosView() {
  const { permissions } = useAuth();
  const [usuarios, setUsuarios] = useState<User[]>(mockUsuarios);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const usuarioData: User = {
      id: editingUsuario?.id || Date.now().toString(),
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      rol: formData.get('rol') as UserRole,
      telefono: formData.get('telefono') as string,
      activo: true,
      createdAt: editingUsuario?.createdAt || new Date().toISOString().split('T')[0],
    };

    if (editingUsuario) {
      setUsuarios(usuarios.map((u) => (u.id === editingUsuario.id ? usuarioData : u)));
    } else {
      setUsuarios([...usuarios, usuarioData]);
    }

    setIsDialogOpen(false);
    setEditingUsuario(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      setUsuarios(usuarios.filter((u) => u.id !== id));
    }
  };

  const toggleActivo = (id: string) => {
    setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)));
  };

  const openDialog = (usuario?: User) => {
    setEditingUsuario(usuario || null);
    setIsDialogOpen(true);
  };

  const getRolBadge = (rol: UserRole) => {
    const config = {
      admin: { label: 'Administrador', className: 'bg-red-600' },
      gerente: { label: 'Gerente', className: 'bg-blue-600' },
      empleado: { label: 'Empleado', className: 'bg-green-600' },
    };
    return (
      <Badge className={config[rol].className}>
        {config[rol].label}
      </Badge>
    );
  };

  const getRolePermissionsDisplay = (rol: UserRole) => {
    const permisos = {
      admin: ['Todos los permisos'],
      gerente: ['Inventario (ver, crear, editar)', 'Facturación (completa)', 'Proveedores (ver, crear, editar)', 'Usuarios (solo ver)'],
      empleado: ['Inventario (solo ver)', 'Facturación (crear)', 'Proveedores (solo ver)'],
    };
    return permisos[rol];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema y sus roles
          </p>
        </div>
        {permissions.usuarios.crear && (
          <Button onClick={() => openDialog()}>
            <Plus className="size-4 mr-2" />
            Agregar Usuario
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  {(permissions.usuarios.editar || permissions.usuarios.eliminar) && (
                    <TableHead>Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{usuario.telefono || 'N/A'}</TableCell>
                    <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={usuario.activo ? 'default' : 'secondary'}
                        className={usuario.activo ? 'bg-green-600' : ''}
                        onClick={() =>
                          permissions.usuarios.editar && toggleActivo(usuario.id)
                        }
                        style={{ cursor: permissions.usuarios.editar ? 'pointer' : 'default' }}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(usuario.createdAt).toLocaleDateString('es-EC')}
                    </TableCell>
                    {(permissions.usuarios.editar || permissions.usuarios.eliminar) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permissions.usuarios.editar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(usuario)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {permissions.usuarios.eliminar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(usuario.id)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Información de Roles y Permisos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5" />
            <h3>Roles y Permisos del Sistema</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(['admin', 'gerente', 'empleado'] as UserRole[]).map((rol) => (
              <div key={rol} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getRolBadge(rol)}
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {getRolePermissionsDisplay(rol).map((permiso, index) => (
                    <li key={index}>• {permiso}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para agregar/editar usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={editingUsuario?.nombre}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingUsuario?.email}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  defaultValue={editingUsuario?.telefono}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Select name="rol" defaultValue={editingUsuario?.rol || 'empleado'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="empleado">Empleado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingUsuario && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    La contraseña predeterminada será: <strong>password123</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    El usuario deberá cambiarla en el primer inicio de sesión.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUsuario ? 'Guardar Cambios' : 'Agregar Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
