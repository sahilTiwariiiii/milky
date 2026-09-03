import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Navbar';
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
import { Loader2 } from 'lucide-react';

const MainLayout = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [currentView, setCurrentView] = useState('dashboard');
  const [summaryStats, setSummaryStats] = useState({ totalRevenue: 0, totalVolume: 0, customersCount: 0 });
  const [quickScannedCustomer, setQuickScannedCustomer] = useState(null);

  const fetchGlobalStats = async () => {
    if (!user) return;
    try {
      const [txRes, custRes] = await Promise.all([
        api.getTransactions({ limit: 1 }),
        api.getCustomers({ limit: 1 })
      ]);
      setSummaryStats({
        totalRevenue: txRes.data?.summary?.totalRevenue || 0,
        totalVolume: txRes.data?.summary?.totalVolume || 0,
        customersCount: custRes.data?.meta?.totalItems || 0
      });
    } catch {}
  };

  useEffect(() => {
    fetchGlobalStats();
  }, [user, currentView]);

  const handleQuickScan = async (token) => {
    try {
      const res = await api.getCustomerByQr(token);
      if (res.success && res.data?.customer) {
        showSuccess(`Verified Customer: ${res.data.customer.name}`);
        setQuickScannedCustomer(res.data.customer);
      }
    } catch (err) {
      if (err.status === 403) {
        showError('ACCESS FORBIDDEN (403): Customer is assigned to another Admin!');
      } else if (err.status === 404) {
        showError(`Customer Not Found (404) for token "${token}"`);
      } else {
        showError(err.message || 'QR Verification failed');
      }
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        background: '#ffffff',
        color: '#ff0013'
      }}>
        <Loader2 size={32} className="animate-spin" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading Dairy Milk ERP System...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onQuickScan={handleQuickScan}
        summaryStats={summaryStats}
      />

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

      {/* Quick Scanned Customer Modal */}
      {quickScannedCustomer && (
        <GiveProductModal
          customer={quickScannedCustomer}
          onClose={() => setQuickScannedCustomer(null)}
          onTransactionCreated={() => {
            fetchGlobalStats();
          }}
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
