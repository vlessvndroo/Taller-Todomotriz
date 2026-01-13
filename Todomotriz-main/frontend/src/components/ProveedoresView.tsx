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
import { Plus, Search, Pencil, Trash2, Phone, Mail, Building2 } from 'lucide-react';
import type { Proveedor } from '../types';

export function ProveedoresView() {
  const { permissions } = useAuth();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el formulario dividido (Teléfono y RIF)
  const [tlfPrefijo, setTlfPrefijo] = useState('0412');
  const [tlfNumero, setTlfNumero] = useState('');
  
  const [rifTipo, setRifTipo] = useState('V');
  const [rifNumero, setRifNumero] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

  // Listas estáticas para Venezuela
  const prefijosTelefonicos = ['0412', '0414', '0424', '0416', '0426', '0422', '0212'];
  const tiposDocumento = ['V', 'J', 'E', 'G'];

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

  const filteredProveedores = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOGICA DE GUARDADO ---

  const handleAddEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Construir los valores compuestos
    const telefonoFinal = `${tlfPrefijo}-${tlfNumero}`;
    const rifFinal = `${rifTipo}-${rifNumero}`;

    const payload = {
      nombre: formData.get('nombre') as string,
      rif: rifFinal,
      contacto: (formData.get('contacto') as string) || null,
      telefono: telefonoFinal,
      email: (formData.get('email') as string) || null,
      direccion: (formData.get('direccion') as string) || null,
      ciudad: (formData.get('ciudad') as string) || null,
      activo: true,
    } as any;

    const errors: Record<string, string> = {};

    // 1. Validar Teléfono (Exactamente 7 dígitos en el campo numérico)
    if (!/^\d{7}$/.test(tlfNumero)) {
      errors.telefono = 'El número debe tener exactamente 7 dígitos (ej: 1234567)';
    }

    // 2. Validar Cédula / RIF (Mínimo 6 dígitos, positivos)
    if (!rifNumero || rifNumero.length < 6) {
      errors.rif = 'Debe tener al menos 6 dígitos.';
    }
    if (Number(rifNumero) < 0) {
      errors.rif = 'No puede ser negativo.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    (async () => {
      try {
        if (editingProveedor) {
          // UPDATE
          const res = await fetch(`${API_BASE}/api/suppliers/${editingProveedor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...editingProveedor, ...payload }),
          });
          if (!res.ok) throw new Error(`Error update: ${res.status}`);
          
          // Actualizar localmente
          setProveedores(proveedores.map((p) => (p.id === editingProveedor.id ? { ...p, ...payload } : p)));
          alert('Proveedor actualizado con éxito');
        } else {
          // CREATE
          const res = await fetch(`${API_BASE}/api/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Error create: ${res.status}`);
          const created = await res.json();
          setProveedores([created, ...proveedores]);
          alert('Proveedor registrado con éxito');
        }

        setIsDialogOpen(false);
        setEditingProveedor(null);
      } catch (err: any) {
        console.error(err);
        alert('Error al guardar: ' + err.message);
      }
    })();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Error al eliminar: ${res.status}`);
      setProveedores(proveedores.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error(err);
      alert('No se pudo eliminar el proveedor. ' + (err.message || ''));
    }
  };

  // Función para abrir el modal y preparar los datos divididos
  const openDialog = (proveedor?: Proveedor) => {
    if (proveedor) {
      setEditingProveedor(proveedor);
      
      // Separar Teléfono (asumiendo formato "0412-1234567")
      if (proveedor.telefono && proveedor.telefono.includes('-')) {
        const [pref, num] = proveedor.telefono.split('-');
        setTlfPrefijo(pref);
        setTlfNumero(num);
      } else {
        setTlfPrefijo('0412');
        setTlfNumero(proveedor.telefono || '');
      }

      // Separar RIF (asumiendo formato "J-123456")
      if (proveedor.rif && proveedor.rif.includes('-')) {
        const [tipo, num] = proveedor.rif.split('-');
        setRifTipo(tipo);
        setRifNumero(num);
      } else {
        setRifTipo('V');
        setRifNumero(proveedor.rif || '');
      }
    } else {
      setEditingProveedor(null);
      // Valores por defecto
      setTlfPrefijo('0412');
      setTlfNumero('');
      setRifTipo('V'); // Por defecto Jurídico para proveedores
      setRifNumero('');
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  if (loading) return <div>Cargando proveedores...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Gestión de Proveedores</h1>
          <p className="text-muted-foreground">
            Directorio de proveedores y contactos
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
                placeholder="Buscar por nombre, RIF o email..."
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
                  <TableHead>Empresa / Nombre</TableHead>
                  <TableHead>Cédula / RIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
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
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Building2 className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{proveedor.nombre}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            {proveedor.email || 'Sin email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{proveedor.rif}</Badge></TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{proveedor.contacto}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          {proveedor.telefono}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{proveedor.ciudad}</p>
                      <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {proveedor.direccion}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={proveedor.activo ? 'default' : 'secondary'} className={proveedor.activo ? 'bg-green-600' : ''}>
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
                              onClick={() => openDialog(proveedor)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {permissions.proveedores.eliminar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(proveedor.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="size-4" />
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
              Información de contacto de la empresa o proveedor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEdit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombre">Razón Social / Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={editingProveedor?.nombre}
                  placeholder="Ej: Repuestos Caracas C.A."
                  required
                />
              </div>

              {/* CAMPO CÉDULA / RIF (MEJORADO) */}
              <div className="space-y-2">
                <Label>Cédula / RIF</Label>
                <div className="flex gap-2">
                  <Select value={rifTipo} onValueChange={setRifTipo}>
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDocumento.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Número (Mín 6 dígitos)"
                    value={rifNumero}
                    onChange={(e) => setRifNumero(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
                {formErrors.rif && (
                  <p className="text-destructive text-xs">{formErrors.rif}</p>
                )}
              </div>

              {/* CAMPO TELEFONO (MEJORADO) */}
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
                    required
                    className="flex-1"
                  />
                </div>
                {formErrors.telefono && (
                  <p className="text-destructive text-xs">{formErrors.telefono}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacto">Persona de Contacto</Label>
                <Input
                  id="contacto"
                  name="contacto"
                  defaultValue={editingProveedor?.contacto || ''}
                  placeholder="Ej: Lic. Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingProveedor?.email || ''}
                  placeholder="contacto@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección Fiscal</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  defaultValue={editingProveedor?.direccion || ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  name="ciudad"
                  defaultValue={editingProveedor?.ciudad || ''}
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