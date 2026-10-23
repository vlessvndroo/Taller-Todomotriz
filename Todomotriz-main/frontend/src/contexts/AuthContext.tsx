import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, UserRole, RolePermissions } from '../types';
import { API_BASE } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  permissions: RolePermissions;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- MATRIZ DE PERMISOS ---
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
    usuarios: { ver: true, crear: false, editar: false, eliminar: false }, // Ver lista, no editar
  },
  empleado: {
    inventario: { ver: true, crear: false, editar: false, eliminar: false },
    facturacion: { ver: true, crear: true, editar: false, anular: false }, // Crea, no edita
    proveedores: { ver: true, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false }, // Sin acceso
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ajusta el puerto si tu backend corre en el 5001 o 5000

  useEffect(() => {
    // Recuperar sesión al recargar
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // PETICIÓN REAL AL BACKEND
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Validar rol recibido (convertimos a minúsculas por si acaso viene "Admin")
      const rolRecibido = data.rol.toLowerCase() as UserRole;
      if (!rolePermissions[rolRecibido]) {
        throw new Error(`Rol desconocido: ${data.rol}`);
      }

      const authUser: AuthUser = { 
        ...data,
        rol: rolRecibido 
      };
      
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));

    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  // Permisos según rol actual
  const permissions = user 
    ? rolePermissions[user.rol] 
    : rolePermissions.empleado; 

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