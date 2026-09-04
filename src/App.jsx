import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Sidebar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminManagement } from './components/AdminManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { ProductManagement } from './components/ProductManagement';
import { TransactionsView } from './components/TransactionsView';
import { QrScanView } from './components/QrScanView';
import { GiveProductModal } from './components/GiveProductModal';
import { SystemConfigView } from './components/SystemConfigView';
import { api } from './services/api';
import { Loader2, Menu } from 'lucide-react';

const MainLayout = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [currentView, setCurrentView] = useState('dashboard');
  const [quickScannedCustomer, setQuickScannedCustomer] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        background: 'linear-gradient(180deg, #E6F4ED 0%, #EEF7F2 50%, #F7FAF8 100%)',
        color: '#2C373B',
        fontFamily: "'Montserrat', Arial, Helvetica, sans-serif"
      }}>
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '3px solid #4CDC9C',
          boxShadow: '0 8px 24px rgba(76, 220, 156, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img src="/applogo.png" alt="Milky Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={20} className="animate-spin text-[#4CDC9C]" />
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#2C373B' }}>Milky Dairy ERP</span>
        </div>
        <span style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600 }}>Loading Dairy Network...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      {/* Dedicated Left Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="app-main-wrapper">
        {/* Mobile Header Bar (Only visible on small mobile screens) */}
        <div className="mobile-header-bar mobile-only">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/applogo.png" alt="Milky Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            <span className="mobile-header-title">Milky Dairy ERP</span>
          </div>
        </div>

        <main className="main-content">
          {currentView === 'dashboard' && (
            isSuperAdmin ? (
              <SuperAdminDashboard
                onNavigate={setCurrentView}
                onOpenScanner={() => setCurrentView('scan')}
              />
            ) : (
              <AdminDashboard
                onNavigate={setCurrentView}
                onOpenScanner={() => setCurrentView('scan')}
              />
            )
          )}

          {currentView === 'scan' && <QrScanView />}

          {currentView === 'admins' && isSuperAdmin && <AdminManagement />}

          {currentView === 'customers' && <CustomerManagement />}

          {currentView === 'products' && <ProductManagement />}

          {currentView === 'transactions' && <TransactionsView />}

          {currentView === 'settings' && isSuperAdmin && <SystemConfigView onNavigate={setCurrentView} />}
        </main>
      </div>

      {/* Quick Scanned Customer Modal */}
      {quickScannedCustomer && (
        <GiveProductModal
          customer={quickScannedCustomer}
          onClose={() => setQuickScannedCustomer(null)}
          onTransactionCreated={() => {}}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
