import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiveProductModal } from './GiveProductModal';
import { PrintableQrBadge } from './PrintableQrBadge';
import {
  Users,
  UserCheck,
  Package,
  ReceiptText,
  IndianRupee,
  QrCode,
  Plus,
  Printer,
  Layers,
  Sparkles,
  Settings,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SuperAdminDashboard = ({ onNavigate, onOpenScanner }) => {
  const { user } = useAuth();
  const { showError } = useToast();

  const [stats, setStats] = useState({
    customersCount: 0,
    adminsCount: 0,
    productsCount: 0,
    totalRevenue: 0,
    totalVolume: 0,
    todayRevenue: 0,
    todayVolume: 0,
    todayDeliveriesCount: 0
  });

  const [adminsPerformance, setAdminsPerformance] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('ADMINS'); // 'ADMINS' | 'RECENT_TXS'

  // Modals
  const [selectedGiveProductCustomer, setSelectedGiveProductCustomer] = useState(null);
  const [selectedBadgeCustomer, setSelectedBadgeCustomer] = useState(null);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const [custRes, prodRes, txGlobalRes, todayTxRes, adminRes] = await Promise.all([
        api.getCustomers({ limit: 1 }),
        api.getProducts({ limit: 100 }),
        api.getTransactions({ limit: 20 }),
        api.getTransactions({ startDate: todayStr, limit: 1000 }),
        api.getAdmins({ limit: 100 })
      ]);

      const admins = adminRes.data?.admins || [];
      const todayTxs = todayTxRes.data?.transactions || [];

      // Calculate Admin Route Performance for today
      // Map adminId -> { completedToday, revenueToday, volumeToday }
      const adminTxStats = {};
      let todayVol = 0;
      let todayRev = 0;

      todayTxs.forEach((tx) => {
        const aId = tx.adminId?._id ? tx.adminId._id.toString() : tx.adminId?.toString();
        if (aId) {
          if (!adminTxStats[aId]) {
            adminTxStats[aId] = { completedToday: 0, revenueToday: 0, volumeToday: 0 };
          }
          adminTxStats[aId].completedToday += 1;
          adminTxStats[aId].revenueToday += Number(tx.totalAmount) || 0;
          adminTxStats[aId].volumeToday += Number(tx.quantity) || 0;
        }
        todayVol += Number(tx.quantity) || 0;
        todayRev += Number(tx.totalAmount) || 0;
      });

      const adminsWithLiveStats = admins.map((admin) => {
        const aId = admin._id.toString();
        const aStat = adminTxStats[aId] || { completedToday: 0, revenueToday: 0, volumeToday: 0 };
        const assignedTotal = admin.assignedCustomerCount || 0;
        const pendingToday = Math.max(0, assignedTotal - aStat.completedToday);
        const completionRate = assignedTotal > 0
          ? Math.min(100, Math.round((aStat.completedToday / assignedTotal) * 100))
          : 0;

        return {
          ...admin,
          completedToday: aStat.completedToday,
          pendingToday,
          revenueToday: Math.round(aStat.revenueToday * 100) / 100,
          volumeToday: Math.round(aStat.volumeToday * 100) / 100,
          completionRate
        };
      });

      setStats({
        customersCount: custRes.data?.meta?.totalItems || 0,
        adminsCount: admins.length,
        productsCount: prodRes.data?.products?.length || 0,
        totalRevenue: txGlobalRes.data?.summary?.totalRevenue || 0,
        totalVolume: txGlobalRes.data?.summary?.totalVolume || 0,
        todayRevenue: Math.round(todayRev * 100) / 100,
        todayVolume: Math.round(todayVol * 100) / 100,
        todayDeliveriesCount: todayTxs.length
      });

      setAdminsPerformance(adminsWithLiveStats);
      setRecentTransactions(txGlobalRes.data?.transactions || []);
    } catch (err) {
      showError(err.message || 'Failed to load executive dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, [user]);

  return (
    <div>
      {/* Executive Command Header */}
      <div className="executive-banner">
        <div className="executive-banner-left">
          <div className="executive-tag">
            <Building2 size={13} />
            <span>HQ Command Center</span>
          </div>
          <h2 className="executive-title">Enterprise Dairy Distribution Overview</h2>
          <p className="executive-sub">
            Real-time multi-route monitoring across {stats.adminsCount} staff routes & {stats.customersCount} active customers
          </p>
        </div>

        <div className="executive-banner-actions">
          <button
            type="button"
            className="btn btn-outline"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: '#fff' }}
            onClick={() => onNavigate('settings')}
          >
            <Settings size={14} />
            <span>System Configuration</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ background: '#4CDC9C', color: '#2C373B', fontWeight: 700 }}
            onClick={onOpenScanner}
          >
            <QrCode size={14} />
            <span>Global QR Scanner</span>
          </button>
        </div>
      </div>

      {/* 1. ENTERPRISE GLOBAL KPI TILES */}
      <div className="enterprise-kpi-grid">
        <div
          className="kpi-tile"
          onClick={() => onNavigate('transactions')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box">
            <div className="inner-circle">
              <IndianRupee size={16} />
            </div>
          </div>
          <div>
            <div className="kpi-title">Today's Revenue / All Time</div>
            <div className="kpi-number">
              ₹{stats.todayRevenue.toLocaleString('en-IN')}{' '}
              <span style={{ fontSize: '0.75rem', color: '#9E9E9E' }}>
                (₹{stats.totalRevenue.toLocaleString('en-IN')})
              </span>
            </div>
          </div>
        </div>

        <div
          className="kpi-tile"
          onClick={() => onNavigate('transactions')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box">
            <div className="inner-circle">
              <Layers size={16} />
            </div>
          </div>
          <div>
            <div className="kpi-title">Today's Milk Dispatched</div>
            <div className="kpi-number">
              {stats.todayVolume}{' '}
              <span style={{ fontSize: '0.75rem', color: '#9E9E9E' }}>Units</span>
            </div>
          </div>
        </div>

        <div
          className="kpi-tile"
          onClick={() => onNavigate('customers')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box">
            <div className="inner-circle">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="kpi-title">Total Customers (All Routes)</div>
            <div className="kpi-number">{stats.customersCount}</div>
          </div>
        </div>

        <div
          className="kpi-tile"
          onClick={() => onNavigate('admins')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box">
            <div className="inner-circle">
              <UserCheck size={16} />
            </div>
          </div>
          <div>
            <div className="kpi-title">Delivery Route Admins</div>
            <div className="kpi-number">{stats.adminsCount}</div>
          </div>
        </div>

        <div
          className="kpi-tile"
          onClick={() => onNavigate('products')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box">
            <div className="inner-circle">
              <Package size={16} />
            </div>
          </div>
          <div>
            <div className="kpi-title">Catalog Dairy Products</div>
            <div className="kpi-number">{stats.productsCount}</div>
          </div>
        </div>
      </div>

      {/* 2. ADMIN ROUTE STAFF PERFORMANCE MONITOR */}
      <div className="enterprise-panel">
        <div className="panel-banner-charcoal">
          <h3>
            <UserCheck size={16} />
            <span>Route Staff Daily Performance & Customer Allocation</span>
          </h3>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              style={{ background: '#fff', color: 'var(--primary-red)' }}
              onClick={() => onNavigate('admins')}
            >
              <UserCheck size={12} />
              <span>Manage Admin Staff</span>
            </button>

            <button
              type="button"
              className="btn btn-xs btn-outline"
              style={{ background: '#fff', color: 'var(--primary-red)' }}
              onClick={() => onNavigate('customers')}
            >
              <Plus size={12} />
              <span>+ Add Customer</span>
            </button>
          </div>
        </div>

        {/* Sub-Filter Tabs */}
        <div className="sub-filter-strip">
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'ADMINS' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('ADMINS')}
          >
            Route Delivery Admins ({adminsPerformance.length})
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'RECENT_TXS' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('RECENT_TXS')}
          >
            Live Global Audit Ledger ({recentTransactions.length})
          </button>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading enterprise monitoring records...
          </div>
        ) : activeSubTab === 'ADMINS' ? (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Route Admin Name</th>
                  <th>Contact Email / Phone</th>
                  <th>Assigned Customers</th>
                  <th>Deliveries Done Today</th>
                  <th>Pending for Today</th>
                  <th>Today's Revenue</th>
                  <th>Route Completion</th>
                </tr>
              </thead>
              <tbody>
                {adminsPerformance.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fafafa' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                        <UserCheck size={36} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-heading)' }}>
                          No Route Delivery Admins Created Yet
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '440px', margin: 0 }}>
                          Super Admin can create delivery route staff and assign customers to them to track daily route completions, pending customers, and revenue.
                        </p>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          style={{ marginTop: '0.5rem', padding: '0.45rem 1rem' }}
                          onClick={() => onNavigate('admins')}
                        >
                          <Plus size={13} />
                          <span>Create Delivery Route Admin</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  adminsPerformance.map((adm, idx) => (
                    <tr key={adm._id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{adm.name}</div>
                        <span className="badge-qr-token" style={{ fontSize: '0.7rem' }}>
                          ID: {adm._id.slice(-6)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>{adm.email}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {adm.mobile || 'No mobile listed'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          {adm.assignedCustomerCount}
                        </span>{' '}
                        customers
                      </td>
                      <td>
                        <span className="badge-status-green">
                          {adm.completedToday} Delivered
                        </span>
                      </td>
                      <td>
                        {adm.pendingToday > 0 ? (
                          <span className="badge-status-red" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                            {adm.pendingToday} Pending
                          </span>
                        ) : (
                          <span className="badge-status-green">All Done!</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, color: '#15803d' }}>
                        ₹{adm.revenueToday.toLocaleString('en-IN')}
                      </td>
                      <td style={{ minWidth: '140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-track" style={{ height: '8px', flex: 1, margin: 0 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${adm.completionRate}%`,
                                background: adm.completionRate === 100 ? '#16a34a' : 'var(--primary-red)'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                            {adm.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer Name</th>
                  <th>QR Token</th>
                  <th>Delivered by Admin</th>
                  <th>Product & Qty</th>
                  <th>Rate Snapshot</th>
                  <th>Total Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No milk distribution records found yet.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx._id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ fontWeight: 700 }}>{tx.customerId?.name || 'Customer'}</td>
                      <td>
                        <span className="badge-qr-token">{tx.customerId?.qrToken || 'N/A'}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-red)' }}>
                        {tx.adminId?.name || 'Admin'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{tx.quantity} {tx.unit}</span> {tx.productName}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        ₹{tx.priceAtTransaction}/{tx.unit}
                      </td>
                      <td style={{ fontWeight: 800, color: '#15803d' }}>₹{tx.totalAmount}</td>
                      <td style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{tx.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div
        className="enterprise-quick-links-grid no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '1.25rem'
        }}
      >
        <div
          className="quick-link-card"
          onClick={() => onNavigate('settings')}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div
            className="quick-link-icon"
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: '#fef2f2',
              color: 'var(--primary-red)'
            }}
          >
            <Settings size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)', marginBottom: '2px' }}>
              System Configuration
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              Update Dairy Name, Logo, Address & Categories
            </div>
          </div>
        </div>

        <div
          className="quick-link-card"
          onClick={() => onNavigate('admins')}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div
            className="quick-link-icon"
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: '#f0fdf4',
              color: '#16a34a'
            }}
          >
            <UserCheck size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)', marginBottom: '2px' }}>
              Manage Delivery Staff
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              Create admins and assign customer route pools
            </div>
          </div>
        </div>

        <div
          className="quick-link-card"
          onClick={() => onNavigate('customers')}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div
            className="quick-link-icon"
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: '#f0f9ff',
              color: '#0284c7'
            }}
          >
            <Users size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)', marginBottom: '2px' }}>
              Customer Master Registry
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              Aadhaar, PAN, Photos & QR Pass issuance
            </div>
          </div>
        </div>

        <div
          className="quick-link-card"
          onClick={() => onNavigate('products')}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div
            className="quick-link-icon"
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: '#fffbeb',
              color: '#d97706'
            }}
          >
            <Package size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)', marginBottom: '2px' }}>
              Product & Unit Pricing
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              Manage milk types, pouches, and billing rates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
