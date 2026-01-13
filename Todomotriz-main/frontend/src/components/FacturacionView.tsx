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
import { Plus, Search, Eye, FileText, Trash2, DollarSign, XCircle, Pencil, ShoppingCart } from 'lucide-react';
import type { Factura, ItemFactura } from '../types';

export function FacturacionView() {
  const { permissions, user } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [viewingFactura, setViewingFactura] = useState<Factura | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);

  const [items, setItems] = useState<ItemFactura[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  
  // Estados para Cédula/RIF Cliente (NUEVO)
  const [clienteRifTipo, setClienteRifTipo] = useState('V');
  const [clienteRifNumero, setClienteRifNumero] = useState('');
  
  // Estados temporales para agregar producto
  const [tempProductoId, setTempProductoId] = useState<string>('');
  const [tempCantidad, setTempCantidad] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
  const tiposDocumento = ['V', 'J', 'E', 'G'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [factRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/api/invoices`),
          fetch(`${API_BASE}/api/products`),
        ]);
        if (!factRes.ok) throw new Error(`Error fetching facturas`);
        
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
      f.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Lógica del Carrito ---

  const handleManualAdd = () => {
    if (!tempProductoId) {
      alert("Por favor seleccione un producto");
      return;
    }
    
    const producto = productos.find((p) => p.id === tempProductoId);
    if (!producto) return;

    if (tempCantidad > producto.cantidad) {
      alert(`Error: No hay suficiente stock. Disponible: ${producto.cantidad}`);
      return;
    }

    if (tempCantidad <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }
    
    handleAddItem(producto, tempCantidad);
    setTempProductoId('');
    setTempCantidad(1);
  };

  const handleAddItem = (producto: any, cantidad: number) => {
    const existingItem = items.find((i) => i.productoId === producto.id);
    
    if (existingItem && (existingItem.cantidad + cantidad > producto.cantidad)) {
        alert(`No puedes agregar más. Total en carrito: ${existingItem.cantidad}. Disponible: ${producto.cantidad}`);
        return;
    }

    if (existingItem) {
      setItems(
        items.map((i) =>
          i.productoId === producto.id
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

  const openNewFactura = () => {
    setEditingFactura(null);
    setItems([]);
    setFormErrors({});
    
    // Resetear estados de Cédula
    setClienteRifTipo('V');
    setClienteRifNumero('');
    
    setTempProductoId('');
    setTempCantidad(1);
    setIsDialogOpen(true);
  };

  const openEditFactura = (factura: Factura) => {
    setEditingFactura(factura);
    setItems(factura.items || []);
    setFormErrors({});

    // Parsear la cédula guardada (ej: "V-12345678")
    if (factura.clienteCedula && factura.clienteCedula.includes('-')) {
        const [tipo, num] = factura.clienteCedula.split('-');
        setClienteRifTipo(tipo);
        setClienteRifNumero(num);
    } else {
        // Fallback por si hay datos viejos sin guión
        setClienteRifTipo('V'); 
        setClienteRifNumero(factura.clienteCedula || '');
    }

    setTempProductoId('');
    setTempCantidad(1);
    setIsDialogOpen(true);
  };

  const handleViewDetails = async (id: string) => {
    try {
        const res = await fetch(`${API_BASE}/api/invoices/${id}`);
        if(res.ok) {
            const data = await res.json();
            setViewingFactura(data);
        } else {
            const local = facturas.find(f => f.id === id);
            setViewingFactura(local || null);
        }
    } catch (e) {
        console.error(e);
    }
  };

  const handleSaveFactura = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { subtotal, iva, total } = calculateTotals();
    
    // Construir la cédula completa
    const cedulaFinal = `${clienteRifTipo}-${clienteRifNumero}`;

    const payload = {
      numeroFactura: editingFactura 
        ? editingFactura.numeroFactura 
        : `FAC-2025-${String(facturas.length + 1).padStart(3, '0')}`,
      fecha: editingFactura ? editingFactura.fecha : new Date().toISOString(),
      cliente: formData.get('cliente') as string,
      clienteCedula: cedulaFinal, // Usamos la compuesta
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
      estado: editingFactura ? editingFactura.estado : 'pendiente',
      metodoPago: formData.get('metodoPago') as string,
      observaciones: (formData.get('observaciones') as string) || null,
      creadoPor: editingFactura ? editingFactura.creadoPor : (user?.nombre || ''),
    };

    // Validaciones
    const errors: Record<string, string> = {};
    
    // Validación de Cédula/RIF
    if (!clienteRifNumero || clienteRifNumero.length < 6) {
        errors.clienteCedula = 'La cédula debe tener al menos 6 dígitos.';
    } else if (Number(clienteRifNumero) < 0) {
        errors.clienteCedula = 'No puede ser negativo.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    (async () => {
      try {
        let savedFactura: Factura;
        if (editingFactura) {
          const res = await fetch(`${API_BASE}/api/invoices/${editingFactura.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: editingFactura.id }),
          });
          if (!res.ok) throw new Error(`Error al actualizar`);
          savedFactura = { ...editingFactura, ...payload } as Factura;
          setFacturas(facturas.map(f => f.id === editingFactura.id ? savedFactura : f));
          alert('Factura actualizada');
        } else {
          const res = await fetch(`${API_BASE}/api/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Error al crear`);
          savedFactura = await res.json();
          setFacturas([savedFactura, ...facturas]);
          alert('Factura creada exitosamente');
          
          // Actualizar inventario localmente
          const prodRes = await fetch(`${API_BASE}/api/products`);
          const prods = await prodRes.json();
          setProductos(prods);
        }
        setIsDialogOpen(false);
        setEditingFactura(null);
        setItems([]);
      } catch (err: any) {
        console.error(err);
        alert('Error: ' + err.message);
      }
    })();
  };

  const updateFacturaStatus = async (facturaSimple: Factura, nuevoEstado: 'pagada' | 'anulada') => {
    try {
      const resGet = await fetch(`${API_BASE}/api/invoices/${facturaSimple.id}`);
      if (!resGet.ok) throw new Error("No se pudo obtener la factura original");
      
      const facturaCompleta = await resGet.json();
      const facturaActualizada = { ...facturaCompleta, estado: nuevoEstado };

      const resPut = await fetch(`${API_BASE}/api/invoices/${facturaSimple.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facturaActualizada),
      });

      if (!resPut.ok) throw new Error(`Error status update`);

      setFacturas(facturas.map((f) => (f.id === facturaSimple.id ? { ...f, estado: nuevoEstado } : f)));
      alert(`Factura ${nuevoEstado === 'pagada' ? 'PAGADA' : 'ANULADA'} correctamente.`);
      
    } catch (err: any) {
      console.error(err);
      alert(`Error: ` + err.message);
    }
  };

  const getEstadoBadge = (estado: Factura['estado']) => {
    switch (estado) {
      case 'pagada': return <Badge className="bg-green-600">Pagada</Badge>;
      case 'pendiente': return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Pendiente</Badge>;
      case 'anulada': return <Badge variant="destructive">Anulada</Badge>;
      default: return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) return <div>Cargando facturación...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Gestión de Facturación</h1>
          <p className="text-muted-foreground">Administra facturas, pagos y ventas.</p>
        </div>
        {permissions.facturacion.crear && (
          <Button onClick={openNewFactura}>
            <Plus className="size-4 mr-2" /> Nueva Factura
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente o placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                    <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                    <TableCell>{new Date(factura.fecha).toLocaleDateString('es-EC')}</TableCell>
                    <TableCell>
                      <p>{factura.cliente}</p>
                      <p className="text-xs text-muted-foreground">{factura.clienteCedula}</p>
                    </TableCell>
                    <TableCell>
                      <p>{factura.vehiculo}</p>
                      <p className="text-xs text-muted-foreground">{factura.placa}</p>
                    </TableCell>
                    <TableCell>${factura.total.toFixed(2)}</TableCell>
                    <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(factura.id)} title="Ver Detalle">
                          <Eye className="size-4" />
                        </Button>
                        {factura.estado === 'pendiente' && permissions.facturacion.editar && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditFactura(factura)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            title="Modificar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {factura.estado === 'pendiente' && permissions.facturacion.editar && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { if(confirm('¿Confirmar pago?')) updateFacturaStatus(factura, 'pagada') }}
                            className="text-green-600 hover:text-green-800 hover:bg-green-100"
                            title="Registrar Pago"
                          >
                            <DollarSign className="size-4 font-bold" />
                          </Button>
                        )}
                        {permissions.facturacion.anular && factura.estado !== 'anulada' && factura.estado !== 'pagada' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { if(confirm('¿Anular factura?')) updateFacturaStatus(factura, 'anulada') }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            title="Anular"
                          >
                            <Trash2 className="size-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFactura ? 'Modificar Factura' : 'Nueva Factura'}</DialogTitle>
            <DialogDescription>
              {editingFactura ? `Editando ${editingFactura.numeroFactura}` : 'Complete los datos para generar una nueva venta'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveFactura}>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input id="cliente" name="cliente" required defaultValue={editingFactura?.cliente} />
                </div>
                
                {/* CAMPO CÉDULA MEJORADO */}
                <div className="space-y-2">
                  <Label>Cédula / RIF</Label>
                  <div className="flex gap-2">
                    <Select value={clienteRifTipo} onValueChange={setClienteRifTipo}>
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
                        value={clienteRifNumero} 
                        onChange={(e) => setClienteRifNumero(e.target.value)}
                        required 
                        className="flex-1"
                    />
                  </div>
                  {formErrors.clienteCedula && <p className="text-destructive text-sm">{formErrors.clienteCedula}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Vehículo</Label>
                  <Input id="vehiculo" name="vehiculo" required defaultValue={editingFactura?.vehiculo || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input id="placa" name="placa" required defaultValue={editingFactura?.placa || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select name="metodoPago" defaultValue={editingFactura?.metodoPago || 'Efectivo'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SECCIÓN AGREGAR PRODUCTOS */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <Label className="mb-2 block font-semibold">Agregar Productos</Label>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 md:col-span-7">
                     <p className="text-xs text-muted-foreground mb-1">Producto</p>
                     <Select value={tempProductoId} onValueChange={setTempProductoId}>
                      <SelectTrigger className="w-full truncate">
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((producto) => (
                          <SelectItem key={producto.id} value={producto.id}>
                            <span className="truncate block max-w-[300px]">
                              {producto.codigo} - {producto.nombre} (${producto.precioVenta.toFixed(2)}) | Stock: {producto.cantidad}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-6 md:col-span-3">
                    <p className="text-xs text-muted-foreground mb-1">Cant.</p>
                    <Input 
                        type="number" 
                        min="1"
                        value={tempCantidad}
                        onChange={(e) => setTempCantidad(Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <Button 
                      type="button" 
                      onClick={handleManualAdd}
                      disabled={!tempProductoId}
                      className="w-full"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Cant.</TableHead>
                        <TableHead>$$</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[200px] truncate" title={item.producto}>{item.producto}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.precioUnitario.toFixed(2)}</TableCell>
                          <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <XCircle className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 bg-muted/20 text-right">
                    <p className="text-xl font-bold text-primary">
                      Total: ${calculateTotals().total.toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground">
                    <ShoppingCart className="size-8 mx-auto mb-2 opacity-50" />
                    <p>Carrito vacío</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea id="observaciones" name="observaciones" rows={2} defaultValue={editingFactura?.observaciones || ''} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={items.length === 0}>
                <FileText className="size-4 mr-2" />
                {editingFactura ? 'Guardar Cambios' : 'Generar Factura'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visor de Detalles (Sin cambios) */}
      <Dialog open={!!viewingFactura} onOpenChange={() => setViewingFactura(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Detalle de Factura</DialogTitle></DialogHeader>
          {viewingFactura && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-bold text-lg">{viewingFactura.numeroFactura}</p>
                </div>
                <div className="text-right">{getEstadoBadge(viewingFactura.estado)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                    <h3 className="font-semibold">Cliente</h3>
                    <p>{viewingFactura.cliente}</p>
                    <p className="text-muted-foreground">CI/RUC: {viewingFactura.clienteCedula}</p>
                 </div>
                 <div>
                    <h3 className="font-semibold">Vehículo</h3>
                    <p>{viewingFactura.vehiculo}</p>
                    <p className="text-muted-foreground">{viewingFactura.placa}</p>
                 </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Productos</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>Producto</TableHead>
                        <TableHead>Cant.</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingFactura.items && viewingFactura.items.length > 0 ? (
                          viewingFactura.items.map(i => (
                            <TableRow key={i.id}>
                              <TableCell>{i.producto}</TableCell>
                              <TableCell>{i.cantidad}</TableCell>
                              <TableCell>${i.precioUnitario.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${i.subtotal.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                      ) : (
                          <TableRow><TableCell colSpan={4} className="text-center py-4">Sin items</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="text-right font-bold text-lg">
                  Total: ${viewingFactura.total.toFixed(2)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}