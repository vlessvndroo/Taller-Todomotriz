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
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { ProductoInventario } from '../types';

export function InventarioView() {
  const { permissions } = useAuth();
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [proveedores, setProveedores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // URL API
  const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, provRes] = await Promise.all([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/suppliers`),
        ]);
        if (!prodRes.ok) throw new Error(`Error fetching products: ${prodRes.status}`);
        if (!provRes.ok) throw new Error(`Error fetching suppliers: ${provRes.status}`);
        
        const prods = await prodRes.json();
        const provs = await provRes.json();
        
        setProductos(prods);
        setProveedores(provs.map((p: any) => p.nombre));
      } catch (err: any) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<ProductoInventario | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categorias = ['Filtros', 'Lubricantes', 'Frenos', 'Baterías', 'Llantas', 'Electricidad', 'Suspensión', 'Motor', 'Transmisión'];

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LÓGICA DE VALIDACIÓN Y GUARDADO ---

  const handleAddEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      codigo: formData.get('codigo') as string,
      nombre: (formData.get('nombre') as string).trim(),
      descripcion: (formData.get('descripcion') as string) || null,
      categoria: (formData.get('categoria') as string) || null,
      cantidad: Number(formData.get('cantidad')),
      precioCompra: Number(formData.get('precioCompra')),
      precioVenta: Number(formData.get('precioVenta')),
      stockMinimo: Number(formData.get('stockMinimo')),
      proveedor: (formData.get('proveedor') as string) || null,
      ubicacion: (formData.get('ubicacion') as string) || null,
    } as any;

    const errors: Record<string, string> = {};

    // 1. Validar Nombre (No solo números)
    // Regex: Al menos una letra (a-z o A-Z)
    if (!/[a-zA-Z]/.test(payload.nombre)) {
      errors.nombre = 'El nombre debe contener letras (no puede ser solo números).';
    }
    if (!payload.nombre) errors.nombre = 'El nombre es requerido.';

    // 2. Validar Negativos
    if (payload.cantidad < 0) errors.cantidad = 'La cantidad no puede ser negativa.';
    if (payload.precioCompra < 0) errors.precioCompra = 'El precio de compra no puede ser negativo.';
    if (payload.precioVenta < 0) errors.precioVenta = 'El precio de venta no puede ser negativo.';
    if (payload.stockMinimo < 0) errors.stockMinimo = 'El stock mínimo no puede ser negativo.';

    // 3. Validar Consistencia de Precios (Opcional pero recomendado)
    if (!errors.precioCompra && !errors.precioVenta && payload.precioVenta < payload.precioCompra) {
      errors.precioVenta = 'Advertencia: El precio de venta es menor al costo.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    // Guardar en Backend
    (async () => {
      try {
        if (editingProducto) {
          // UPDATE (PUT)
          const res = await fetch(`${API_BASE}/api/products/${editingProducto.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...editingProducto, ...payload }),
          });

          if (!res.ok) throw new Error(`Error actualizando: ${res.status}`);
          
          setProductos(productos.map((p) => (p.id === editingProducto.id ? { ...p, ...payload } : p)));
          alert('Producto actualizado correctamente');
        } else {
          // CREATE (POST)
          const res = await fetch(`${API_BASE}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error(`Error creando: ${res.status}`);
          const created = await res.json();
          setProductos([created, ...productos]);
          alert('Producto agregado al inventario');
        }

        setIsDialogOpen(false);
        setEditingProducto(null);
      } catch (err: any) {
        console.error(err);
        alert('Error al guardar: ' + err.message);
      }
    })();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Error deleting`);
      setProductos(productos.filter((p) => p.id !== id));
    } catch (e) { 
      console.error(e);
      alert('Error al eliminar producto'); 
    }
  };

  const openDialog = (producto?: ProductoInventario) => {
    setEditingProducto(producto || null);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  if (loading) return <div>Cargando inventario...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Gestión de Inventario</h1>
          <p className="text-muted-foreground">
            Administra los productos y repuestos del taller
          </p>
        </div>
        {permissions.inventario.crear && (
          <Button onClick={() => openDialog()}>
            <Plus className="size-4 mr-2" />
            Agregar Producto
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o categoría..."
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
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  {(permissions.inventario.editar || permissions.inventario.eliminar) && (
                    <TableHead>Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductos.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>
                      <div>
                        <p>{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {producto.ubicacion}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{producto.categoria}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {producto.cantidad}
                        {producto.cantidad <= producto.stockMinimo && (
                          <AlertTriangle className="size-4 text-orange-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${producto.precioVenta.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{producto.proveedor}</TableCell>
                    <TableCell>
                      {producto.cantidad <= producto.stockMinimo ? (
                        <Badge variant="destructive">Stock Bajo</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-600">
                          Disponible
                        </Badge>
                      )}
                    </TableCell>
                    {(permissions.inventario.editar || permissions.inventario.eliminar) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permissions.inventario.editar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(producto)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {permissions.inventario.eliminar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(producto.id)}
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

      {/* Dialog para agregar/editar producto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProducto ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del producto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEdit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              
              {/* CODIGO */}
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  defaultValue={editingProducto?.codigo}
                  required
                />
              </div>

              {/* NOMBRE */}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={editingProducto?.nombre}
                  required
                />
                {formErrors.nombre && (
                  <p className="text-destructive text-xs">{formErrors.nombre}</p>
                )}
              </div>

              {/* DESCRIPCION */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  defaultValue={editingProducto?.descripcion}
                  rows={2}
                />
              </div>

              {/* CATEGORIA */}
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select name="categoria" defaultValue={editingProducto?.categoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CANTIDAD */}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad Inicial</Label>
                <Input
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  min="0"
                  defaultValue={editingProducto?.cantidad}
                  required
                />
                {formErrors.cantidad && (
                  <p className="text-destructive text-xs">{formErrors.cantidad}</p>
                )}
              </div>

              {/* PRECIO COMPRA */}
              <div className="space-y-2">
                <Label htmlFor="precioCompra">Precio Compra ($)</Label>
                <Input
                  id="precioCompra"
                  name="precioCompra"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingProducto?.precioCompra}
                  required
                />
                {formErrors.precioCompra && (
                  <p className="text-destructive text-xs">{formErrors.precioCompra}</p>
                )}
              </div>

              {/* PRECIO VENTA */}
              <div className="space-y-2">
                <Label htmlFor="precioVenta">Precio Venta ($)</Label>
                <Input
                  id="precioVenta"
                  name="precioVenta"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingProducto?.precioVenta}
                  required
                />
                {formErrors.precioVenta && (
                  <p className="text-destructive text-xs">{formErrors.precioVenta}</p>
                )}
              </div>

              {/* STOCK MINIMO */}
              <div className="space-y-2">
                <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                <Input
                  id="stockMinimo"
                  name="stockMinimo"
                  type="number"
                  min="0"
                  defaultValue={editingProducto?.stockMinimo}
                  required
                />
                {formErrors.stockMinimo && (
                  <p className="text-destructive text-xs">{formErrors.stockMinimo}</p>
                )}
              </div>

              {/* PROVEEDOR */}
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Select name="proveedor" defaultValue={editingProducto?.proveedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* UBICACION */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  name="ubicacion"
                  defaultValue={editingProducto?.ubicacion}
                  placeholder="Ej: Estante A-12"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProducto ? 'Guardar Cambios' : 'Agregar Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}