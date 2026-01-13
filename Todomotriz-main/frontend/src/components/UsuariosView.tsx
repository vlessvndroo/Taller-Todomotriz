import { useEffect, useState } from 'react';
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
import { Plus, Search, Pencil, Trash2, Shield, Lock, Phone } from 'lucide-react';
import type { User, UserRole } from '../types';

export function UsuariosView() {
  const { user: currentUser, permissions } = useAuth(); // Necesitamos 'currentUser' para saber si soy admin
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el teléfono dividido
  const [tlfPrefijo, setTlfPrefijo] = useState('0412');
  const [tlfNumero, setTlfNumero] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
  const prefijosTelefonicos = ['0412', '0414', '0424', '0416', '0426', '0422', '0212'];

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/users`);
        if (!res.ok) throw new Error(`Error fetching usuarios: ${res.status}`);
        const data = await res.json();
        setUsuarios(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LÓGICA DE GUARDADO ---
  const handleAddEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Construir teléfono
    let telefonoFinal = null;
    if (tlfNumero.trim() !== '') {
        telefonoFinal = `${tlfPrefijo}-${tlfNumero}`;
    }

    // Recopilar datos
    const payload = {
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      rol: formData.get('rol') as UserRole,
      telefono: telefonoFinal,
      // La contraseña se envía si se escribió algo, o si es un usuario nuevo
      password: (formData.get('password') as string) || (editingUsuario ? (editingUsuario as any).password : 'password123'),
      activo: true, 
    } as any;

    const errors: Record<string, string> = {};
    
    // Validaciones
    if (!payload.email) errors.email = 'Email requerido';
    
    // Validar teléfono (si escribió algo, deben ser 7 números)
    if (tlfNumero.trim() !== '' && !/^\d{7}$/.test(tlfNumero)) {
        errors.telefono = 'El número debe tener exactamente 7 dígitos';
    }

    // Validar contraseña (Obligatoria si es nuevo)
    const passInput = formData.get('password') as string;
    if (!editingUsuario && !passInput) {
        errors.password = 'La contraseña es obligatoria para nuevos usuarios';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    (async () => {
      try {
        if (editingUsuario) {
          // UPDATE
          const res = await fetch(`${API_BASE}/api/users/${editingUsuario.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...editingUsuario, ...payload }),
          });

          if (!res.ok) throw new Error(`Error al actualizar: ${res.status}`);
          
          setUsuarios(usuarios.map((u) => (u.id === editingUsuario.id ? { ...u, ...payload } : u)));
          alert('Usuario modificado correctamente');
        } else {
          // CREATE
          const res = await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error(`Error al crear: ${res.status}`);
          const created = await res.json();
          setUsuarios([created, ...usuarios]);
          alert('Usuario creado correctamente');
        }

        setIsDialogOpen(false);
        setEditingUsuario(null);
      } catch (err: any) {
        console.error(err);
        alert('Error al guardar: ' + (err.message || String(err)));
      }
    })();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Error al eliminar: ${res.status}`);
      setUsuarios(usuarios.filter((u) => u.id !== id));
    } catch (err: any) {
      console.error(err);
      alert('No se pudo eliminar el usuario. ' + (err.message || ''));
    }
  };

  const toggleActivo = (id: string) => {
    // Nota: Idealmente esto debería hacer una petición PUT al backend para persistir el cambio
    setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)));
  };

  const openDialog = (usuario?: User) => {
    if (usuario) {
      setEditingUsuario(usuario);
      // Separar teléfono si existe
      if (usuario.telefono && usuario.telefono.includes('-')) {
        const [pref, num] = usuario.telefono.split('-');
        setTlfPrefijo(pref);
        setTlfNumero(num);
      } else {
        setTlfPrefijo('0412');
        setTlfNumero('');
      }
    } else {
      setEditingUsuario(null);
      setTlfPrefijo('0412');
      setTlfNumero('');
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const getRolBadge = (rol: UserRole) => {
    const config = {
      admin: { label: 'Administrador', className: 'bg-red-600' },
      gerente: { label: 'Gerente', className: 'bg-blue-600' },
      empleado: { label: 'Empleado', className: 'bg-green-600' },
    };
    return <Badge className={config[rol].className}>{config[rol].label}</Badge>;
  };

  const getRolePermissionsDisplay = (rol: UserRole) => {
    const permisos = {
      admin: ['Todos los permisos'],
      gerente: ['Inventario (ver, crear, editar)', 'Facturación (completa)', 'Proveedores (ver, crear, editar)', 'Usuarios (solo ver)'],
      empleado: ['Inventario (solo ver)', 'Facturación (crear)', 'Proveedores (solo ver)'],
    };
    return permisos[rol];
  };

  // Verificamos si el usuario actual es admin para mostrar contraseñas
  const isAdmin = currentUser?.rol === 'admin';

  if (loading) return <div>Cargando usuarios...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

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
                  {/* COLUMNA PASSWORD (Solo Admin) */}
                  {isAdmin && <TableHead className="text-red-500 font-bold">Contraseña</TableHead>}
                  <TableHead>Estado</TableHead>
                  {(permissions.usuarios.editar || permissions.usuarios.eliminar) && (
                    <TableHead>Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nombre}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {usuario.telefono ? <Phone className="size-3" /> : null}
                            {usuario.telefono || 'N/A'}
                        </div>
                    </TableCell>
                    <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                    
                    {/* CELDA PASSWORD (Solo Admin) */}
                    {isAdmin && (
                        <TableCell>
                            <div className="flex items-center gap-1 text-xs font-mono bg-gray-100 p-1 rounded w-fit text-gray-600">
                                <Lock className="size-3" />
                                {/* Mostramos la contraseña si viene del backend, sino asteriscos */}
                                {(usuario as any).password || '****'}
                            </div>
                        </TableCell>
                    )}

                    <TableCell>
                      <Badge
                        variant={usuario.activo ? 'default' : 'secondary'}
                        className={usuario.activo ? 'bg-green-600' : ''}
                        onClick={() => permissions.usuarios.editar && toggleActivo(usuario.id)}
                        style={{ cursor: permissions.usuarios.editar ? 'pointer' : 'default' }}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
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

      {/* Información de Roles */}
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

      {/* Dialog para agregar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del usuario para el acceso al sistema.
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
                  placeholder="Ej: Juan Pérez"
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
                  placeholder="usuario@taller.com"
                  required
                />
                {formErrors.email && <p className="text-destructive text-xs">{formErrors.email}</p>}
              </div>

              {/* CAMPO DE CONTRASEÑA */}
              <div className="space-y-2">
                 <Label htmlFor="password">Contraseña</Label>
                 <Input 
                    id="password"
                    name="password"
                    type="text" // Texto visible para que el admin verifique
                    placeholder={editingUsuario ? "Dejar en blanco para no cambiar" : "Contraseña inicial"}
                 />
                 {formErrors.password && <p className="text-destructive text-xs">{formErrors.password}</p>}
              </div>

              {/* CAMPO TELEFONO (MEJORADO VENEZUELA) */}
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <div className="flex gap-2">
                  <Select value={tlfPrefijo} onValueChange={setTlfPrefijo}>
                    <SelectTrigger className="w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prefijosTelefonicos.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="1234567"
                    value={tlfNumero}
                    onChange={(e) => setTlfNumero(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {formErrors.telefono && (
                  <p className="text-destructive text-xs">{formErrors.telefono}</p>
                )}
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