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
import { Plus, Search, Eye, FileText, Trash2 } from 'lucide-react';
// replaced mocks with API fetch
import type { Factura, ItemFactura } from '../types';

export function FacturacionView() {
  const { permissions, user } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingFactura, setViewingFactura] = useState<Factura | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [items, setItems] = useState<ItemFactura[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [factRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/api/invoices`),
          fetch(`${API_BASE}/api/products`),
        ]);
        if (!factRes.ok) throw new Error(`Error fetching facturas: ${factRes.status}`);
        if (!prodRes.ok) throw new Error(`Error fetching products: ${prodRes.status}`);
        const facts = await factRes.json();
        const prods = await prodRes.json();
        setFacturas(facts);
        setProductos(prods);
      } catch (err: any) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredFacturas = facturas.filter(
    (f) =>
      f.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (productoId: string, cantidad: number) => {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;

    const existingItem = items.find((i) => i.productoId === productoId);
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.productoId === productoId
            ? {
                ...i,
                cantidad: i.cantidad + cantidad,
                subtotal: (i.cantidad + cantidad) * i.precioUnitario,
              }
            : i
        )
      );
    } else {
      const newItem: ItemFactura = {
        id: Date.now().toString(),
        productoId: producto.id,
        producto: producto.nombre,
        cantidad,
        precioUnitario: producto.precioVenta,
        subtotal: cantidad * producto.precioVenta,
      };
      setItems([...items, newItem]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const handleCreateFactura = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { subtotal, iva, total } = calculateTotals();
    const payload = {
      numeroFactura: `FAC-2025-${String(facturas.length + 1).padStart(3, '0')}`,
      fecha: new Date().toISOString(),
      cliente: formData.get('cliente') as string,
      clienteCedula: (formData.get('clienteCedula') as string) || null,
      vehiculo: (formData.get('vehiculo') as string) || null,
      placa: (formData.get('placa') as string) || null,
      items: items.map((it) => ({
        productoId: it.productoId,
        producto: it.producto,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        subtotal: it.subtotal,
      })),
      subtotal,
      iva,
      total,
      estado: 'pendiente',
      metodoPago: formData.get('metodoPago') as string,
      observaciones: (formData.get('observaciones') as string) || null,
      creadoPor: user?.nombre || '',
    } as any;

    // frontend validation: validar que la cédula no sea vacía ni negativa
    const errors: Record<string, string> = {};
    const clienteCedula = ((formData.get('clienteCedula') as string) || '').trim();
    if (!clienteCedula) {
      errors.clienteCedula = 'Cédula requerida';
    } else if (isNaN(Number(clienteCedula))) {
      errors.clienteCedula = 'La cédula debe ser un número válido';
    } else if (Number(clienteCedula) < 0) {
      errors.clienteCedula = 'La cédula no puede ser un número negativo';
    }


    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create invoice failed: ${res.status}`);
        const created: Factura = await res.json();
        setFacturas([created, ...facturas]);
        setIsCreating(false);
        setItems([]);
      } catch (err: any) {
        console.error(err);
        alert('Error al crear factura: ' + (err.message || String(err)));
      }
    })();
  };

  const handleAnular = (id: string) => {
    if (confirm('¿Está seguro de anular esta factura?')) {
      setFacturas(
        facturas.map((f) => (f.id === id ? { ...f, estado: 'anulada' as const } : f))
      );
    }
  };

  const getEstadoBadge = (estado: Factura['estado']) => {
    switch (estado) {
      case 'pagada':
        return <Badge className="bg-green-600">Pagada</Badge>;
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'anulada':
        return <Badge variant="destructive">Anulada</Badge>;
    }
  };

  if (loading) return <div>Loading facturación...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Gestión de Facturación</h1>
          <p className="text-muted-foreground">
            Administra las facturas y ventas del taller
          </p>
        </div>
        {permissions.facturacion.crear && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="size-4 mr-2" />
            Nueva Factura
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente o placa..."
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
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell>{factura.numeroFactura}</TableCell>
                    <TableCell>
                      {new Date(factura.fecha).toLocaleDateString('es-EC')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{factura.cliente}</p>
                        <p className="text-sm text-muted-foreground">
                          Cedula: {factura.clienteCedula}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{factura.vehiculo}</p>
                        <p className="text-sm text-muted-foreground">
                          {factura.placa}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>${factura.total.toFixed(2)}</TableCell>
                    <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingFactura(factura)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {permissions.facturacion.anular && factura.estado !== 'anulada' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            //onClick={() => handleAnular(factura.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para crear factura */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Factura</DialogTitle>
            <DialogDescription>
              Complete los datos de la factura
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFactura}>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input id="cliente" name="cliente" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteCedula">Cédula</Label>
                  <Input id="clienteCedula" name="clienteCedula" required />
                  {formErrors.clienteCedula && (
                    <p className="text-destructive text-sm mt-1">{formErrors.clienteCedula}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiculo">Vehículo</Label>
                  <Input id="vehiculo" name="vehiculo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placa">Placa</Label>
                  <Input id="placa" name="placa" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metodoPago">Método de Pago</Label>
                  <Select name="metodoPago" defaultValue="Efectivo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Agregar Productos</Label>
                <div className="flex gap-2">
                  <Select onValueChange={(value) => handleAddItem(value, 1)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccione producto" />
                    </SelectTrigger>
                    <SelectContent>
                        {productos.map((producto) => (
                          <SelectItem key={producto.id} value={producto.id}>
                            {producto.nombre} - ${producto.precioVenta?.toFixed?.(2) ?? producto.precioVenta}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {items.length > 0 && (
                <div className="border border-border rounded-lg p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.producto}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.precioUnitario.toFixed(2)}</TableCell>
                          <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 space-y-2 text-right">
                    <p>Subtotal: ${calculateTotals().subtotal.toFixed(2)}</p>
                    <p>IVA (16%): ${calculateTotals().iva.toFixed(2)}</p>
                    <p className="text-xl">
                      Total: ${calculateTotals().total.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea id="observaciones" name="observaciones" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={items.length === 0}>
                <FileText className="size-4 mr-2" />
                Generar Factura
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver factura */}
      <Dialog open={!!viewingFactura} onOpenChange={() => setViewingFactura(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
          </DialogHeader>
          {viewingFactura && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p>{viewingFactura.numeroFactura}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p>{new Date(viewingFactura.fecha).toLocaleString('es-EC')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p>{viewingFactura.cliente}</p>
                  <p className="text-sm">Cedula: {viewingFactura.clienteCedula}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p>{viewingFactura.vehiculo}</p>
                  <p className="text-sm">{viewingFactura.placa}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingFactura.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.producto}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>${item.precioUnitario.toFixed(2)}</TableCell>
                        <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-right space-y-1">
                <p>Subtotal: ${viewingFactura.subtotal.toFixed(2)}</p>
                <p>IVA: ${viewingFactura.iva.toFixed(2)}</p>
                <p className="text-xl">Total: ${viewingFactura.total.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p>{viewingFactura.metodoPago}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getEstadoBadge(viewingFactura.estado)}
                </div>
              </div>

              {viewingFactura.observaciones && (
                <div>
                  <p className="text-sm text-muted-foreground">Observaciones</p>
                  <p>{viewingFactura.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
