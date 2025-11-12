import { useState } from 'react';
import { AuthProvider, useAuth } from "./contexts/AuthContext.tsx";
import { LoginPage } from "./components/LoginPage.tsx";
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { InventarioView } from './components/InventarioView.tsx';
import { FacturacionView } from './components/FacturacionView.tsx';
import { ProveedoresView } from './components/ProveedoresView.tsx';
import { UsuariosView } from './components/UsuariosView.tsx';

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
