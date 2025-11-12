import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  Users,
  LogOut,
  Menu,
  X,
  Wrench,
} from 'lucide-react';
import { Button } from './ui/button.tsx';
import { cn } from './ui/utils.ts';
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: string;
}

export function DashboardLayout({
  children,
  currentView,
  onNavigate,
}: DashboardLayoutProps) {
  const { user, logout, permissions } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="size-5" />,
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: <Package className="size-5" />,
      requiredPermission: 'inventario',
    },
    {
      id: 'facturacion',
      label: 'Facturación',
      icon: <FileText className="size-5" />,
      requiredPermission: 'facturacion',
    },
    {
      id: 'proveedores',
      label: 'Proveedores',
      icon: <Truck className="size-5" />,
      requiredPermission: 'proveedores',
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: <Users className="size-5" />,
      requiredPermission: 'usuarios',
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    // Cast the string key to the keys of the permissions object so TS can validate the index
    return permissions[item.requiredPermission as keyof typeof permissions]?.ver;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-r border-border transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 md:w-20'
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <Wrench className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm">Taller Automotriz</h2>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                currentView === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              )}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          {sidebarOpen && (
            <div className="mb-3 px-3">
              <p className="text-xs text-muted-foreground">Usuario</p>
              <p className="text-sm truncate">{user?.nombre}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.rol}</p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="size-4" />
            {sidebarOpen && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
