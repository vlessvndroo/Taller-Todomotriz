import { useAuth } from '../contexts/AuthContext.tsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.tsx';
import { Package, FileText, Truck, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { mockInventario, mockFacturas, mockProveedores, mockUsuarios } from '../data/mockData.ts';

export function Dashboard() {
  const { user } = useAuth();

  const productosStockBajo = mockInventario.filter(
    (p) => p.cantidad <= p.stockMinimo
  ).length;

  const facturasPendientes = mockFacturas.filter(
    (f) => f.estado === 'pendiente'
  ).length;

  const totalVentasHoy = mockFacturas
    .filter((f) => {
      const hoy = new Date().toISOString().split('T')[0];
      const fechaFactura = f.fecha.split('T')[0];
      return fechaFactura === hoy && f.estado === 'pagada';
    })
    .reduce((acc, f) => acc + f.total, 0);

  const stats = [
    {
      title: 'Productos en Inventario',
      value: mockInventario.length,
      icon: <Package className="size-6 text-blue-600" />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Facturas del Mes',
      value: mockFacturas.length,
      icon: <FileText className="size-6 text-green-600" />,
      bgColor: 'bg-green-50',
    },
    {
      title: 'Proveedores Activos',
      value: mockProveedores.filter((p) => p.activo).length,
      icon: <Truck className="size-6 text-purple-600" />,
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Usuarios Registrados',
      value: mockUsuarios.filter((u) => u.activo).length,
      icon: <Users className="size-6 text-orange-600" />,
      bgColor: 'bg-orange-50',
    },
  ];

  const alerts = [
    {
      title: 'Productos con Stock Bajo',
      value: productosStockBajo,
      description: `${productosStockBajo} producto(s) requieren reabastecimiento`,
      severity: productosStockBajo > 0 ? 'warning' : 'success',
    },
    {
      title: 'Facturas Pendientes',
      value: facturasPendientes,
      description: `${facturasPendientes} factura(s) pendientes de pago`,
      severity: facturasPendientes > 0 ? 'warning' : 'success',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.nombre}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ventas del día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Ventas del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">${totalVentasHoy.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">
            Total de ventas pagadas hoy
          </p>
        </CardContent>
      </Card>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alerts.map((alert, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {alert.severity === 'warning' && (
                  <AlertTriangle className="size-5 text-orange-600" />
                )}
                {alert.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl mb-2 ${
                  alert.severity === 'warning' ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                {alert.value}
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Productos con stock bajo */}
      {productosStockBajo > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productos que Requieren Reabastecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockInventario
                .filter((p) => p.cantidad <= p.stockMinimo)
                .map((producto) => (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p>{producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Código: {producto.codigo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Stock actual: <span className="text-orange-600">{producto.cantidad}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {producto.stockMinimo}
                      </p>
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
