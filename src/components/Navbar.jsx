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
      {/* Iconic Red Polka Dot Ribbon */}
      <div className="amul-polka-ribbon" title="The Taste of India" />

      {/* 1. TOP BRAND & SYSTEM BAR */}
      <div className="top-sys-header">
        <div className="sys-info-left">
          <button
            type="button"
            className="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(true)}
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>

          <div className="brand-badge" onClick={() => setCurrentView('dashboard')} style={{ cursor: 'pointer' }}>
            {orgConfig.profileImage || orgConfig.orgLogo ? (
              <img
                src={orgConfig.profileImage || orgConfig.orgLogo}
                alt="Org Logo"
                style={{ height: '24px', width: 'auto', maxHeight: '24px', objectFit: 'contain', borderRadius: '2px' }}
              />
            ) : null}
            <span className="brand-badge-logo">{orgConfig.orgName || 'Milky'}</span>
            <span className="brand-badge-sub">• Dairy ERP</span>
          </div>

          <div className="branch-selector desktop-only">
            <span>Route Hub: Central Dairy Sector</span>
          </div>
        </div>

        <div className="sys-info-right">
          {/* Quick 1-Click Role Switcher (Desktop Only) */}
          <div className="quick-demo-accounts desktop-only">
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
            <span className="desktop-only">{isSuperAdmin ? `Super Admin (${user?.name})` : `Admin (${user?.name})`}</span>
            <span className="mobile-only-pill">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
          </div>

          <button type="button" className="btn-sys-logout" onClick={logout} title="Logout">
            <LogOut size={13} />
            <span className="desktop-only">LOGOUT</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY MODULE TABS (Desktop Only Red Bar) */}
      <nav className="module-tabs-nav desktop-only">
        <ul className="tabs-list">
          <button
            type="button"
            className={`module-tab-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'scan' ? 'active' : ''}`}
            onClick={() => setCurrentView('scan')}
          >
            <QrCode size={15} />
            <span>Scan QR Pass</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'customers' ? 'active' : ''}`}
            onClick={() => setCurrentView('customers')}
          >
            <Users size={15} />
            <span>Customers</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'products' ? 'active' : ''}`}
            onClick={() => setCurrentView('products')}
          >
            <Package size={15} />
            <span>Products & Units</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${currentView === 'transactions' ? 'active' : ''}`}
            onClick={() => setCurrentView('transactions')}
          >
            <ReceiptText size={15} />
            <span>Distribution Ledger</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                type="button"
                className={`module-tab-btn ${currentView === 'admins' ? 'active' : ''}`}
                onClick={() => setCurrentView('admins')}
              >
                <UserCheck size={15} />
                <span>Admin Staff</span>
              </button>

              <button
                type="button"
                className={`module-tab-btn ${currentView === 'settings' ? 'active' : ''}`}
                onClick={() => setCurrentView('settings')}
              >
                <Settings size={15} />
                <span>System Config</span>
              </button>
            </>
          )}
        </ul>
      </nav>

      {/* 3. QUICK SCAN ACTION STRIP & LIVE FINANCIAL TICKER (Desktop Only) */}
      <div className="quick-action-strip desktop-only">
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

      {/* 4. DEDICATED SLIDE-OUT MOBILE SIDEBAR DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-sidebar-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                {orgConfig.profileImage || orgConfig.orgLogo ? (
                  <img
                    src={orgConfig.profileImage || orgConfig.orgLogo}
                    alt="Logo"
                    style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
                  />
                ) : null}
                <div>
                  <div className="mobile-drawer-brand-title">{orgConfig.orgName || 'Milky Dairy'}</div>
                  <div className="mobile-drawer-brand-sub">Enterprise Distribution ERP</div>
                </div>
              </div>

              <button
                type="button"
                className="close-drawer-btn"
                onClick={() => setMobileMenuOpen(false)}
                title="Close Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Card in Drawer */}
            <div className="drawer-user-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="drawer-avatar" />
                ) : (
                  <div className="drawer-avatar-fallback">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div className="drawer-name">{user?.name}</div>
                  <div className="drawer-role-badge">
                    <ShieldCheck size={12} />
                    <span>{isSuperAdmin ? 'Super Administrator' : 'Route Delivery Admin'}</span>
                  </div>
                </div>
              </div>
              <div className="drawer-route-text">
                <Building2 size={12} />
                <span>Route Hub: Central Dairy Sector</span>
              </div>
            </div>

            {/* Quick QR Lookup inside Drawer */}
            <form
              className="drawer-search-form"
              onSubmit={(e) => {
                handleQuickScanSubmit(e);
                setMobileMenuOpen(false);
              }}
            >
              <input
                type="text"
                placeholder="Quick QR Token (e.g. CUST_...)"
                value={quickToken}
                onChange={(e) => setQuickToken(e.target.value.toUpperCase())}
              />
              <button type="submit" title="Scan Token">
                <Search size={15} />
              </button>
            </form>

            {/* Navigation List */}
            <div className="drawer-section">
              <div className="drawer-section-heading">MAIN MENU</div>
              <nav className="drawer-nav-menu">
                <button
                  type="button"
                  className={`drawer-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard Overview</span>
                </button>

                <button
                  type="button"
                  className={`drawer-nav-btn ${currentView === 'scan' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('scan');
                    setMobileMenuOpen(false);
                  }}
                >
                  <QrCode size={18} />
                  <span>Scan QR Pass / Camera</span>
                </button>

                <button
                  type="button"
                  className={`drawer-nav-btn ${currentView === 'customers' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('customers');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Users size={18} />
                  <span>Customer Directory</span>
                </button>

                <button
                  type="button"
                  className={`drawer-nav-btn ${currentView === 'products' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('products');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Package size={18} />
                  <span>Products & Units</span>
                </button>

                <button
                  type="button"
                  className={`drawer-nav-btn ${currentView === 'transactions' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('transactions');
                    setMobileMenuOpen(false);
                  }}
                >
                  <ReceiptText size={18} />
                  <span>Distribution Ledger</span>
                </button>

                {isSuperAdmin && (
                  <>
                    <button
                      type="button"
                      className={`drawer-nav-btn ${currentView === 'admins' ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentView('admins');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <UserCheck size={18} />
                      <span>Admin Staff</span>
                    </button>

                    <button
                      type="button"
                      className={`drawer-nav-btn ${currentView === 'settings' ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentView('settings');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Settings size={18} />
                      <span>System Configuration</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Quick Role Switcher */}
            <div className="drawer-section">
              <div className="drawer-section-heading">SWITCH DEMO ACCOUNT</div>
              <div className="drawer-role-pills">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = user?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      className={`drawer-role-pill ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        quickLogin(acc);
                        setMobileMenuOpen(false);
                      }}
                    >
                      {acc.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Financial Summary */}
            <div className="drawer-section">
              <div className="drawer-section-heading">TODAY'S SUMMARY</div>
              <div className="drawer-kpi-grid">
                <div className="drawer-kpi-tile">
                  <span className="drawer-kpi-title">Revenue</span>
                  <strong className="drawer-kpi-number">₹{summaryStats.totalRevenue || 0}</strong>
                </div>
                <div className="drawer-kpi-tile">
                  <span className="drawer-kpi-title">Volume</span>
                  <strong className="drawer-kpi-number">{summaryStats.totalVolume || 0} U</strong>
                </div>
                <div className="drawer-kpi-tile">
                  <span className="drawer-kpi-title">Customers</span>
                  <strong className="drawer-kpi-number">{summaryStats.customersCount || 0}</strong>
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <div className="drawer-bottom-action">
              <button
                type="button"
                className="drawer-logout-full-btn"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut size={16} />
                <span>Log Out of Milky</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
