import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { InventarioView } from './pages/InventarioView';
import { FacturacionView } from './pages/FacturacionView';
import { ProveedoresView } from './pages/ProveedoresView';
import { UsuariosView } from './pages/UsuariosView';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventario':
        return <InventarioView />;
      case 'facturacion':
        return <FacturacionView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'usuarios':
        return <UsuariosView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
