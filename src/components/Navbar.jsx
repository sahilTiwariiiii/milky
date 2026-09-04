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
  LayoutDashboard,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = ({
  currentView,
  setCurrentView,
  isCollapsed = false,
  setIsCollapsed,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user, isSuperAdmin, logout, quickLogin } = useAuth();
  const [orgConfig, setOrgConfig] = useState({ orgName: 'Milky', orgLogo: '' });

  useEffect(() => {
    api.getSystemConfig()
      .then((res) => {
        if (res.success && res.data?.config) {
          setOrgConfig(res.data.config);
        }
      })
      .catch(() => {});

    const handleConfigUpdate = (e) => {
      if (e.detail) setOrgConfig(e.detail);
    };

    window.addEventListener('config:updated', handleConfigUpdate);
    return () => window.removeEventListener('config:updated', handleConfigUpdate);
  }, []);

  const handleNavClick = (view) => {
    setCurrentView(view);
    if (mobileOpen && setMobileOpen) setMobileOpen(false);
  };

  const navItemsMain = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Scan QR Pass', icon: QrCode }
  ];

  const navItemsOps = [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products & Units', icon: Package },
    { id: 'transactions', label: 'Distribution Ledger', icon: ReceiptText }
  ];

  const navItemsAdmin = isSuperAdmin ? [
    { id: 'admins', label: 'Admin Staff', icon: UserCheck },
    { id: 'settings', label: 'System Config', icon: Settings }
  ] : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-group" onClick={() => handleNavClick('dashboard')}>
            <div className="sidebar-brand-icon" style={{ overflow: 'hidden', borderRadius: '50%' }}>
              <img
                src={orgConfig.profileImage || orgConfig.orgLogo || '/applogo.png'}
                alt="Logo"
                className="sidebar-brand-img"
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-name">{orgConfig.orgName || 'Milky Dairy'}</span>
                <span className="brand-sub">Dairy ERP</span>
              </div>
            )}
          </div>

          {setIsCollapsed && (
            <button
              type="button"
              className="sidebar-toggle-btn desktop-only"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {setMobileOpen && (
            <button
              type="button"
              className="sidebar-close-btn mobile-only"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-content">
          {/* Section: My Space */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-group-badge-wrapper">
                <span className="sidebar-badge-myspace">MY SPACE</span>
              </div>
            )}
            <nav className="sidebar-nav">
              {navItemsMain.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="sidebar-item-icon" />
                    {!isCollapsed && <span className="sidebar-item-label">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section: Operations */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-group-label">OPERATIONS</div>
            )}
            <nav className="sidebar-nav">
              {navItemsOps.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="sidebar-item-icon" />
                    {!isCollapsed && <span className="sidebar-item-label">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section: Administration (Super Admin only) */}
          {navItemsAdmin.length > 0 && (
            <div className="sidebar-section">
              {!isCollapsed && (
                <div className="sidebar-group-label">ADMINISTRATION</div>
              )}
              <nav className="sidebar-nav">
                {navItemsAdmin.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={18} className="sidebar-item-icon" />
                      {!isCollapsed && <span className="sidebar-item-label">{item.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Quick Demo Role Switcher inside Sidebar Footer */}
          {!isCollapsed && (
            <div className="sidebar-role-switch-container">
              <span className="sidebar-role-switch-label">SWITCH DEMO ROLE</span>
              <div className="sidebar-role-pills">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = user?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      className={`sidebar-role-pill ${isActive ? 'active' : ''}`}
                      onClick={() => quickLogin(acc)}
                      title={`Switch to ${acc.title}`}
                    >
                      {acc.role === 'SUPER_ADMIN' ? 'Super Admin' : acc.title.split(' ')[1]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Info & Logout */}
          <div className="sidebar-user-block">
            {!isCollapsed && (
              <div className="sidebar-user-card">
                <div className="sidebar-user-avatar">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.name} />
                  ) : (
                    <span>{(user?.name || 'A').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{user?.name || 'Administrator'}</span>
                  <span className="sidebar-user-role">
                    {isSuperAdmin ? 'Super Admin' : 'Route Admin'}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={logout}
              title="Sign Out"
            >
              <LogOut size={16} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// Export Navbar as alias to Sidebar for seamless backward compatibility
export const Navbar = Sidebar;
