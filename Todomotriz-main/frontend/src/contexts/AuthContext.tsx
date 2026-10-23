import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, UserRole, RolePermissions } from '../types';
import { api, SESSION_EXPIRED_EVENT, SESSION_KEY } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  permissions: RolePermissions;
  isLoading: boolean;
  /** true si la última sesión se cerró porque el token venció */
  sessionExpired: boolean;
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

/** Sesión guardada válida: con token JWT real y sin vencer */
function readSession(): AuthUser | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const user = JSON.parse(saved) as AuthUser;
    const payload = JSON.parse(atob(user.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) throw new Error('expirado');
    return user;
  } catch {
    // Sesión de una versión anterior (sin JWT), corrupta o vencida
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Recuperar sesión al recargar
    setUser(readSession());
    setIsLoading(false);

    // El backend rechazó el token: se cierra la sesión
    const onExpired = () => {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      setSessionExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await api<AuthUser>('/auth/login', 'POST', { email, password });

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
      setSessionExpired(false);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));

    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // Permisos según rol actual
  const permissions = user 
    ? rolePermissions[user.rol] 
    : rolePermissions.empleado; 

  return (
    <AuthContext.Provider value={{ user, login, logout, permissions, isLoading, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}