import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Package, FileText, Truck, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { API_BASE } from '../lib/api';

export function Dashboard() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [pRes, fRes, sRes, uRes] = await Promise.all([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/invoices`),
          fetch(`${API_BASE}/api/suppliers`),
          fetch(`${API_BASE}/api/users`),
        ]);
        if (!pRes.ok) throw new Error(`products: ${pRes.status}`);
        if (!fRes.ok) throw new Error(`invoices: ${fRes.status}`);
        if (!sRes.ok) throw new Error(`suppliers: ${sRes.status}`);
        if (!uRes.ok) throw new Error(`users: ${uRes.status}`);
        const [pData, fData, sData, uData] = await Promise.all([pRes.json(), fRes.json(), sRes.json(), uRes.json()]);
        setProductos(pData);
        setFacturas(fData);
        setProveedores(sData);
        setUsuarios(uData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  const productosStockBajo = productos.filter((p) => p.cantidad <= p.stockMinimo).length;
  const facturasPendientes = facturas.filter((f: any) => f.estado === 'pendiente').length;

  const hoyISO = new Date().toISOString().split('T')[0];
  const totalVentasHoy = facturas
    .filter((f: any) => {
      const fechaFactura = (f.fecha ?? '').split?.('T')?.[0] ?? '';
      return fechaFactura === hoyISO && f.estado === 'pagada';
    })
    .reduce((acc: number, f: any) => acc + (f.total || 0), 0);

  const stats = [
    { title: 'Productos en Inventario', value: productos.length, icon: <Package className="size-6 text-blue-600" />, bgColor: 'bg-blue-50' },
    { title: 'Facturas del Mes', value: facturas.length, icon: <FileText className="size-6 text-green-600" />, bgColor: 'bg-green-50' },
    { title: 'Proveedores Activos', value: proveedores.filter((p: any) => p.activo).length, icon: <Truck className="size-6 text-purple-600" />, bgColor: 'bg-purple-50' },
    { title: 'Usuarios Registrados', value: usuarios.filter((u: any) => u.activo).length, icon: <Users className="size-6 text-orange-600" />, bgColor: 'bg-orange-50' },
  ];

  const alerts = [
    { title: 'Productos con Stock Bajo', value: productosStockBajo, description: `${productosStockBajo} producto(s) requieren reabastecimiento`, severity: productosStockBajo > 0 ? 'warning' : 'success' },
    { title: 'Facturas Pendientes', value: facturasPendientes, description: `${facturasPendientes} factura(s) pendientes de pago`, severity: facturasPendientes > 0 ? 'warning' : 'success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido, {user?.nombre}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="size-5" />Ventas del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">${totalVentasHoy.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Total de ventas pagadas hoy</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alerts.map((alert, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {alert.severity === 'warning' && <AlertTriangle className="size-5 text-orange-600" />}
                {alert.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl mb-2 ${alert.severity === 'warning' ? 'text-orange-600' : 'text-green-600'}`}>{alert.value}</div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {productosStockBajo > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productos que Requieren Reabastecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productos.filter((p) => p.cantidad <= p.stockMinimo).map((producto: any) => (
                <div key={producto.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p>{producto.nombre}</p>
                    <p className="text-sm text-muted-foreground">Código: {producto.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Stock actual: <span className="text-orange-600">{producto.cantidad}</span></p>
                    <p className="text-sm text-muted-foreground">Mínimo: {producto.stockMinimo}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
