import React, { useState } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../lib/theme';
import { initials } from '../../lib/format';
import { ROLES } from '../../lib/constants';
import type { RolePermissions } from '../../types';
import { cn } from '../ui/utils';
import { Logo } from './Logo';

export type ViewId = 'dashboard' | 'inventario' | 'facturacion' | 'proveedores' | 'usuarios';

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: keyof RolePermissions;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { id: 'inventario', label: 'Inventario', icon: <Package />, requiredPermission: 'inventario' },
  { id: 'facturacion', label: 'Facturación', icon: <FileText />, requiredPermission: 'facturacion' },
  { id: 'proveedores', label: 'Proveedores', icon: <Truck />, requiredPermission: 'proveedores' },
  { id: 'usuarios', label: 'Usuarios', icon: <Users />, requiredPermission: 'usuarios' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
}

export function DashboardLayout({ children, currentView, onNavigate }: DashboardLayoutProps) {
  const { user, logout, permissions } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter((item) => !item.requiredPermission || permissions[item.requiredPermission].ver);

  const navigate = (view: ViewId) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const sidebar = (isMobile: boolean) => {
    const compact = collapsed && !isMobile;
    return (
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        <div className={cn('flex h-[72px] items-center border-b border-sidebar-border px-4', compact && 'justify-center px-0')}>
          <Logo compact={compact} />
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {!compact && (
            <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-muted">Operación</p>
          )}
          {visibleItems.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                title={compact ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors [&_svg]:size-5 [&_svg]:shrink-0',
                  compact && 'justify-center px-0',
                  active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                {item.icon}
                {!compact && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <div className={cn('flex items-center gap-3 rounded-xl bg-sidebar-accent p-2.5', compact && 'justify-center bg-transparent p-0')}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 font-display text-sm font-bold text-primary">
              {initials(user?.nombre)}
            </div>
            {!compact && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.nombre}</p>
                <p className="text-xs text-sidebar-muted">{user ? ROLES[user.rol].label : ''}</p>
              </div>
            )}
          </div>

          <div className={cn('flex gap-2', compact && 'flex-col')}>
            <SidebarButton onClick={toggleTheme} label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} compact>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </SidebarButton>
            {!isMobile && (
              <SidebarButton
                onClick={() => setCollapsed(!collapsed)}
                label={collapsed ? 'Expandir menú' : 'Contraer menú'}
                compact
              >
                {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
              </SidebarButton>
            )}
            <SidebarButton onClick={logout} label="Cerrar sesión" compact={compact} className="flex-1">
              <LogOut />
            </SidebarButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Escritorio */}
      <aside
        className={cn(
          'no-print hidden shrink-0 transition-[width] duration-300 lg:block',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        {sidebar(false)}
      </aside>

      {/* Móvil: menú deslizable */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebar(true)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 shrink-0 items-center gap-3 border-b bg-sidebar px-4 text-sidebar-foreground lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-sidebar-accent"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <Logo />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarButton({
  children,
  label,
  compact,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string; compact?: boolean }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cn(
        'flex h-9 items-center justify-center gap-2 rounded-lg border border-sidebar-border px-2.5 text-sm font-semibold text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {children}
      {!compact && <span>{label}</span>}
    </button>
  );
}
