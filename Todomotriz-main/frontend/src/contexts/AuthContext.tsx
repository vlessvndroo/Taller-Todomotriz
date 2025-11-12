import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, UserRole, RolePermissions } from "../types/index.ts";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  permissions: RolePermissions;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permisos por rol
const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    inventario: { ver: true, crear: true, editar: true, eliminar: true },
    facturacion: { ver: true, crear: true, editar: true, anular: true },
    proveedores: { ver: true, crear: true, editar: true, eliminar: true },
    usuarios: { ver: true, crear: true, editar: true, eliminar: true },
  },
  gerente: {
    inventario: { ver: true, crear: true, editar: true, eliminar: false },
    facturacion: { ver: true, crear: true, editar: true, anular: true },
    proveedores: { ver: true, crear: true, editar: true, eliminar: false },
    usuarios: { ver: true, crear: false, editar: false, eliminar: false },
  },
  empleado: {
    inventario: { ver: true, crear: false, editar: false, eliminar: false },
    facturacion: { ver: true, crear: true, editar: false, anular: false },
    proveedores: { ver: true, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
  },
};

// Usuarios de prueba
const mockUsers: AuthUser[] = [
  {
    id: '1',
    nombre: 'Admin Principal',
    email: 'admin@taller.com',
    rol: 'admin',
    activo: true,
    telefono: '0999999999',
    createdAt: '2024-01-01',
    token: 'mock-token-admin',
  },
  {
    id: '2',
    nombre: 'Juan Gerente',
    email: 'gerente@taller.com',
    rol: 'gerente',
    activo: true,
    telefono: '0988888888',
    createdAt: '2024-01-01',
    token: 'mock-token-gerente',
  },
  {
    id: '3',
    nombre: 'Carlos Empleado',
    email: 'empleado@taller.com',
    rol: 'empleado',
    activo: true,
    telefono: '0977777777',
    createdAt: '2024-01-01',
    token: 'mock-token-empleado',
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simular llamada a API - en producción esto llamaría a tu backend C#
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundUser = mockUsers.find((u) => u.email === email);
    
    if (!foundUser || password !== 'password123') {
      throw new Error('Credenciales inválidas');
    }

    setUser(foundUser);
    localStorage.setItem('authUser', JSON.stringify(foundUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  const permissions = user ? rolePermissions[user.rol] : rolePermissions.empleado;

  return (
    <AuthContext.Provider value={{ user, login, logout, permissions, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
