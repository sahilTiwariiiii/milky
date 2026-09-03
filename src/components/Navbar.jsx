import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Milk,
  QrCode,
  Users,
  Package,
  ReceiptText,
  UserCheck,
  LogOut,
  ShieldCheck,
  Search,
  LayoutDashboard,
  Sparkles,
  Settings,
  Building2,
  Menu,
  X,
  User
} from 'lucide-react';

export const Navbar = ({ currentView, setCurrentView, onQuickScan, summaryStats = {} }) => {
  const { user, isSuperAdmin, logout, quickLogin } = useAuth();
  const [quickToken, setQuickToken] = useState('');
  const [orgConfig, setOrgConfig] = useState({ orgName: 'Milky Dairy', orgLogo: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getSystemConfig()
      .then((res) => {
        if (res.success && res.data?.config) {
          setOrgConfig(res.data.config);
        }
      })
      .catch(() => {});

    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setOrgConfig(e.detail);
      }
    };

    window.addEventListener('config:updated', handleConfigUpdate);
    return () => window.removeEventListener('config:updated', handleConfigUpdate);
  }, []);

  const handleQuickScanSubmit = (e) => {
    e.preventDefault();
    if (quickToken.trim() && onQuickScan) {
      onQuickScan(quickToken.trim().toUpperCase());
      setQuickToken('');
    }
  };

  return (
    <header className="no-print">
      {/* Iconic  Red Polka Dot Ribbon (from reference image) */}
      <div className="amul-polka-ribbon" title="The Taste of India" />

      {/* 1. TOP BRAND & SYSTEM BAR */}
      <div className="top-sys-header">
        <div className="sys-info-left">
          <button
            type="button"
            className="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="brand-badge">
            {orgConfig.profileImage || orgConfig.orgLogo ? (
              <img
                src={orgConfig.profileImage || orgConfig.orgLogo}
                alt="Org Logo"
                style={{ height: '24px', width: 'auto', maxHeight: '24px', objectFit: 'contain', borderRadius: '2px' }}
              />
            ) : null}
            <span className="brand-badge-logo">{orgConfig.orgName || 'Milky'}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>• Dairy ERP</span>
          </div>
          <div className="branch-selector">
            <span>Route Hub: Central Dairy Sector</span>
          </div>
        </div>

        <div className="sys-info-right">
          {/* Quick 1-Click Role Switcher */}
          <div className="quick-demo-accounts">
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>Switch:</span>
            {DEMO_ACCOUNTS.map((acc) => {
              const isActive = user?.email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  className={`demo-account-pill ${isActive ? 'active' : ''}`}
                  style={isActive ? { background: '#ff0013', color: '#fff', borderColor: '#ff0013' } : {}}
                  onClick={() => quickLogin(acc)}
                  title={`Login as ${acc.title}`}
                >
                  {acc.role === 'SUPER_ADMIN' ? 'Super Admin' : acc.title.split(' ')[1]}
                </button>
              );
            })}
          </div>

          <div className="user-role-label">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.6)' }}
              />
            ) : (
              <ShieldCheck size={14} />
            )}
            <span>{isSuperAdmin ? `Super Admin (${user?.name})` : `Admin (${user?.name})`}</span>
          </div>

          <button type="button" className="btn-sys-logout" onClick={logout} title="Logout">
            <LogOut size={13} />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY MODULE TABS (Iconic Red Bar) */}
      <nav className={`module-tabs-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <ul className="tabs-list">
          <button
            type="button"
            className={`module-tab-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'scan' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('scan');
              setMobileMenuOpen(false);
            }}
          >
            <QrCode size={15} />
            <span>Scan QR Pass</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'customers' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('customers');
              setMobileMenuOpen(false);
            }}
          >
            <Users size={15} />
            <span>Customers</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'products' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('products');
              setMobileMenuOpen(false);
            }}
          >
            <Package size={15} />
            <span>Products & Units</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'transactions' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('transactions');
              setMobileMenuOpen(false);
            }}
          >
            <ReceiptText size={15} />
            <span>Distribution Ledger</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                type="button"
                className={`module-tab-btn ${currentView === 'admins' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('admins');
                  setMobileMenuOpen(false);
                }}
              >
                <UserCheck size={15} />
                <span>Admin Staff</span>
              </button>

              <button
                type="button"
                className={`module-tab-btn ${currentView === 'settings' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('settings');
                  setMobileMenuOpen(false);
                }}
              >
                <Settings size={15} />
                <span>System Config</span>
              </button>
            </>
          )}
        </ul>
      </nav>

      {/* 3. QUICK SCAN ACTION STRIP & LIVE FINANCIAL TICKER */}
      <div className="quick-action-strip">
        <form className="quick-scan-form" onSubmit={handleQuickScanSubmit}>
          <span className="quick-scan-label">Quick QR Scan:</span>
          <input
            type="text"
            className="quick-scan-input"
            placeholder="Ex: CUST_8F72K91X"
            value={quickToken}
            onChange={(e) => setQuickToken(e.target.value.toUpperCase())}
          />
          <button type="submit" className="btn-scan-submit">
            <Search size={14} />
            <span>Scan / Find</span>
          </button>
        </form>

        <div className="finance-ticker">
          <div className="ticker-item sales">
            <span>Revenue:</span>
            <span>₹{summaryStats.totalRevenue || '0'}/-</span>
          </div>
          <div style={{ color: '#e5dede' }}>|</div>
          <div className="ticker-item volume">
            <span>Volume:</span>
            <span>{summaryStats.totalVolume || '0'} Units</span>
          </div>
          <div style={{ color: '#e5dede' }}>|</div>
          <div className="ticker-item customers">
            <span>Customers:</span>
            <span>{summaryStats.customersCount || '0'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
