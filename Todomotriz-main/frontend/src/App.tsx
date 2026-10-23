import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FeedbackProvider } from './components/feedback/FeedbackProvider';
import { DashboardLayout, type ViewId } from './components/layout/DashboardLayout';
import { LoadingState } from './components/common/States';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/dashboard/Dashboard';
import { InventarioView } from './pages/inventario/InventarioView';
import { FacturacionView } from './pages/facturacion/FacturacionView';
import { ProveedoresView } from './pages/proveedores/ProveedoresView';
import { UsuariosView } from './pages/usuarios/UsuariosView';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');

  if (isLoading) return <LoadingState />;
  if (!user) return <LoginPage />;

  const renderView = () => {
    switch (currentView) {
      case 'inventario':
        return <InventarioView />;
      case 'facturacion':
        return <FacturacionView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'usuarios':
        return <UsuariosView />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
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
      <FeedbackProvider>
        <AppContent />
      </FeedbackProvider>
    </AuthProvider>
  );
}
