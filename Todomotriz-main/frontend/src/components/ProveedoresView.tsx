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
import { Plus, Search, Pencil, Trash2, Phone, Mail } from 'lucide-react';
// fetch proveedores from API
import type { Proveedor } from '../types';

export function ProveedoresView() {
  const { permissions } = useAuth();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/suppliers`);
        if (!res.ok) throw new Error(`Error fetching proveedores: ${res.status}`);
        const data = await res.json();
        setProveedores(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchProveedores();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredProveedores = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading proveedores...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  const handleAddEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      nombre: formData.get('nombre') as string,
      rif: formData.get('rif') as string,
      contacto: (formData.get('contacto') as string) || null,
      telefono: (formData.get('telefono') as string) || null,
      email: (formData.get('email') as string) || null,
      direccion: (formData.get('direccion') as string) || null,
      ciudad: (formData.get('ciudad') as string) || null,
      activo: true,
    } as any;

    // frontend validations: evitar rif/email duplicados
    const errors: Record<string, string> = {};
    const rifLower = (payload.rif || '').trim().toLowerCase();
    const emailLower = (payload.email || '').trim().toLowerCase();
    if (!rifLower) {
      errors.rif = 'RIF requerido';
    }
    if (!emailLower) {
      errors.email = 'Email requerido';
    }
    // buscar duplicados en la lista actual de proveedores
    const duplicateRif = proveedores.find((p) => p.rif.trim().toLowerCase() === rifLower && (!editingProveedor || p.id !== editingProveedor.id));
    const duplicateEmail = proveedores.find((p) => (p.email || '').trim().toLowerCase() === emailLower && (!editingProveedor || p.id !== editingProveedor.id));
    if (duplicateRif) errors.rif = 'Ya existe un proveedor con ese RIF';
    if (duplicateEmail) errors.email = 'Ya existe un proveedor con ese correo';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    (async () => {
      try {
        if (editingProveedor) {
          const res = await fetch(`${API_BASE}/api/suppliers/${editingProveedor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...editingProveedor, ...payload }),
          });
          if (!res.ok) throw new Error(`Update failed: ${res.status}`);
          setProveedores(proveedores.map((p) => (p.id === editingProveedor.id ? { ...p, ...payload } : p)));
        } else {
          const res = await fetch(`${API_BASE}/api/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Create failed: ${res.status}`);
          const created = await res.json();
          setProveedores([created, ...proveedores]);
        }
        setIsDialogOpen(false);
        setEditingProveedor(null);
      } catch (err: any) {
        console.error(err);
        alert('Error al guardar proveedor: ' + (err.message || String(err)));
      }
    })();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      setProveedores(proveedores.filter((p) => p.id !== id));
    }
  };

  const toggleActivo = (id: string) => {
    setProveedores(
      proveedores.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
    );
  };

  const openDialog = (proveedor?: Proveedor) => {
    setEditingProveedor(proveedor || null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Gestión de Proveedores</h1>
          <p className="text-muted-foreground">
            Administra los proveedores del taller
          </p>
        </div>
        {permissions.proveedores.crear && (
          <Button onClick={() => openDialog()}>
            <Plus className="size-4 mr-2" />
            Agregar Proveedor
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RIF o ciudad..."
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
                  <TableHead>RIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  {(permissions.proveedores.editar || permissions.proveedores.eliminar) && (
                    <TableHead>Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell>
                      <div>
                        <p>{proveedor.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {proveedor.direccion}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{proveedor.rif}</TableCell>
                    <TableCell>
                      <div>
                        <p>{proveedor.contacto}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="size-3" />
                          {proveedor.telefono}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="size-3" />
                          {proveedor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{proveedor.ciudad}</TableCell>
                    <TableCell>
                      <Badge
                        variant={proveedor.activo ? 'default' : 'secondary'}
                        className={proveedor.activo ? 'bg-green-600' : ''}
                        onClick={() =>
                          permissions.proveedores.editar && toggleActivo(proveedor.id)
                        }
                        style={{ cursor: permissions.proveedores.editar ? 'pointer' : 'default' }}
                      >
                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    {(permissions.proveedores.editar || permissions.proveedores.eliminar) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permissions.proveedores.editar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              //onClick={() => openDialog(proveedor)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {permissions.proveedores.eliminar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              //onClick={() => handleDelete(proveedor.id)}
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

      {/* Dialog para agregar/editar proveedor */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProveedor ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del proveedor
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEdit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombre">Nombre de la Empresa</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={editingProveedor?.nombre}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rif">RIF</Label>
                <Input
                  id="rif"
                  name="rif"
                  defaultValue={editingProveedor?.rif}
                  required
                />
                {formErrors.rif && (
                  <p className="text-destructive text-sm mt-1">{formErrors.rif}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Nombre del Contacto</Label>
                <Input
                  id="contacto"
                  name="contacto"
                  defaultValue={editingProveedor?.contacto}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  defaultValue={editingProveedor?.telefono}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingProveedor?.email}
                  required
                />
                {formErrors.email && (
                  <p className="text-destructive text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  defaultValue={editingProveedor?.direccion}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  name="ciudad"
                  defaultValue={editingProveedor?.ciudad}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProveedor ? 'Guardar Cambios' : 'Agregar Proveedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
