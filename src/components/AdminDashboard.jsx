import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiveProductModal } from './GiveProductModal';
import { PrintableQrBadge } from './PrintableQrBadge';
import {
  Users,
  Package,
  IndianRupee,
  QrCode,
  ReceiptText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Search
} from 'lucide-react';

export const AdminDashboard = ({ onNavigate, onOpenScanner }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    completedToday: 0,
    pendingToday: 0,
    todayVolume: 0,
    todayRevenue: 0
  });

  // Sub-tabs: 'LEFT' | 'ALL' | 'DONE'
  const [routeTab, setRouteTab] = useState('LEFT');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedGiveMilkCustomer, setSelectedGiveMilkCustomer] = useState(null);
  const [selectedBadgeCustomer, setSelectedBadgeCustomer] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get today's date string YYYY-MM-DD
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const [custRes, txRes] = await Promise.all([
        api.getCustomers({ limit: 500 }),
        api.getTransactions({ startDate: todayStr, limit: 500 })
      ]);

      const assignedCustomers = custRes.data?.customers || [];
      const txs = txRes.data?.transactions || [];

      // Filter txs strictly for today
      const todayOnlyTxs = txs.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate.toDateString() === now.toDateString();
      });

      // Build a map of customer ID -> array of today's transactions
      const customerTxMap = {};
      let totalVol = 0;
      let totalRev = 0;

      todayOnlyTxs.forEach((tx) => {
        const cId = tx.customerId?._id ? tx.customerId._id.toString() : tx.customerId?.toString();
        if (cId) {
          if (!customerTxMap[cId]) customerTxMap[cId] = [];
          customerTxMap[cId].push(tx);
        }
        totalVol += Number(tx.quantity) || 0;
        totalRev += Number(tx.totalAmount) || 0;
      });

      // Attach today's status to each customer
      const enrichedCustomers = assignedCustomers.map((c) => {
        const cId = c._id.toString();
        const cTxs = customerTxMap[cId] || [];
        const isCompleted = cTxs.length > 0;
        const totalQtyToday = cTxs.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
        const totalAmtToday = cTxs.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);

        return {
          ...c,
          isCompletedToday: isCompleted,
          todayTransactions: cTxs,
          todayDeliveredQty: totalQtyToday,
          todayDeliveredAmt: totalAmtToday,
          lastDeliveryTime: cTxs.length > 0 ? cTxs[0].createdAt : null
        };
      });

      const completedCount = enrichedCustomers.filter((c) => c.isCompletedToday).length;
      const pendingCount = Math.max(0, enrichedCustomers.length - completedCount);

      setSummary({
        totalCustomers: enrichedCustomers.length,
        completedToday: completedCount,
        pendingToday: pendingCount,
        todayVolume: Math.round(totalVol * 100) / 100,
        todayRevenue: Math.round(totalRev * 100) / 100
      });

      setCustomers(enrichedCustomers);
      setTodayTransactions(todayOnlyTxs);
    } catch (err) {
      showError(err.message || 'Failed to load route dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Filter customers by route tab and search query
  const filteredCustomers = customers.filter((c) => {
    if (routeTab === 'LEFT' && c.isCompletedToday) return false;
    if (routeTab === 'DONE' && !c.isCompletedToday) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchMobile = c.mobile?.includes(q);
      const matchToken = c.qrToken?.toLowerCase().includes(q);
      const matchAddress = c.address?.toLowerCase().includes(q);
      return matchName || matchMobile || matchToken || matchAddress;
    }
    return true;
  });

  const completionPercent = summary.totalCustomers > 0
    ? Math.round((summary.completedToday / summary.totalCustomers) * 100)
    : 0;

  return (
    <div>
      {/* Route Progress Header Banner */}
      <div className="route-status-banner">
        <div className="route-banner-info">
          <div className="route-driver-tag">
            <span>Route Operator:</span>
            <strong>{user?.name || 'Assigned Admin'}</strong>
          </div>
          <h2 className="route-banner-heading">Today's Route Delivery Manifest</h2>
          <div className="route-banner-sub">
            {summary.completedToday} of {summary.totalCustomers} Customers Delivered Today ({completionPercent}% Complete)
          </div>
        </div>

        <div className="route-banner-actions">
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: '#fff', color: 'var(--primary-red)', fontWeight: 800 }}
            onClick={onOpenScanner}
          >
            <QrCode size={16} />
            <span>Scan Customer QR Pass</span>
          </button>
        </div>
      </div>

      {/* Visual Route Progress Bar */}
      <div className="route-progress-card">
        <div className="progress-label-row">
          <span className="progress-title">Daily Milk Delivery Progress</span>
          <span className="progress-percent-val">{completionPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${completionPercent}%`,
              background: completionPercent === 100
                ? '#16a34a'
                : 'linear-gradient(90deg, #ff0013 0%, #f59e0b 100%)'
            }}
          />
        </div>
      </div>

      {/* 1. KEY ROUTE KPI TILES */}
      <div className="enterprise-kpi-grid">
        <div
          className="kpi-tile kpi-blue"
          onClick={() => setRouteTab('ALL')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box kpi-icon-blue">
            <Users size={18} />
          </div>
          <div>
            <div className="kpi-title">Assigned Customers</div>
            <div className="kpi-number">{summary.totalCustomers}</div>
          </div>
        </div>

        <div
          className="kpi-tile kpi-green"
          onClick={() => setRouteTab('DONE')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box kpi-icon-green">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="kpi-title">Completed Today</div>
            <div className="kpi-number" style={{ color: '#15803d' }}>
              {summary.completedToday}
            </div>
          </div>
        </div>

        <div
          className="kpi-tile kpi-amber"
          onClick={() => setRouteTab('LEFT')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-box kpi-icon-amber">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="kpi-title">Left for Today (Pending)</div>
            <div className="kpi-number" style={{ color: '#d97706' }}>
              {summary.pendingToday}
            </div>
          </div>
        </div>

        <div className="kpi-tile kpi-purple">
          <div className="kpi-icon-box kpi-icon-purple">
            <Package size={18} />
          </div>
          <div>
            <div className="kpi-title">Today Dispatched</div>
            <div className="kpi-number">
              {summary.todayVolume} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>L / Units</span>
            </div>
          </div>
        </div>

        <div className="kpi-tile kpi-green">
          <div className="kpi-icon-box kpi-icon-green">
            <IndianRupee size={18} />
          </div>
          <div>
            <div className="kpi-title">Today Revenue</div>
            <div className="kpi-number">₹{summary.todayRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* 2. ENTERPRISE MANIFEST PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <ReceiptText size={16} />
            <span>Today's Customer Delivery Manifest</span>
          </h3>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              style={{ background: '#fff', color: 'var(--primary-red)' }}
              onClick={onOpenScanner}
            >
              <QrCode size={12} />
              <span>Open Scanner</span>
            </button>
          </div>
        </div>

        {/* Sub-Filter Tabs */}
        <div className="sub-filter-strip">
          <button
            type="button"
            className={`sub-tab-btn ${routeTab === 'LEFT' ? 'active' : ''}`}
            onClick={() => setRouteTab('LEFT')}
          >
            ⏳ Left for Today ({summary.pendingToday})
          </button>

          <button
            type="button"
            className={`sub-tab-btn ${routeTab === 'DONE' ? 'active' : ''}`}
            onClick={() => setRouteTab('DONE')}
          >
            ✅ Completed Today ({summary.completedToday})
          </button>

          <button
            type="button"
            className={`sub-tab-btn ${routeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setRouteTab('ALL')}
          >
            📋 All Assigned Route Customers ({summary.totalCustomers})
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="panel-toolbar">
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search customer name, phone, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
            <Search
              size={14}
              style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        {/* Route Manifest Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading route manifest...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {routeTab === 'LEFT' && summary.pendingToday === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={36} style={{ color: '#16a34a' }} />
                <h4 style={{ color: '#15803d', fontWeight: 800 }}>All Route Deliveries Completed for Today!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Outstanding work! Every customer on your assigned route has received their dairy delivery today.
                </p>
              </div>
            ) : (
              'No customers found matching this filter.'
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Customer Profile</th>
                  <th>QR Token</th>
                  <th>Phone</th>
                  <th>Delivery Address</th>
                  <th>Today's Delivery Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, idx) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>

                    {/* Customer Photo & Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {c.profileImage || c.image ? (
                          <img
                            src={c.profileImage || c.image}
                            alt={c.name}
                            className="table-avatar-img"
                            onClick={() => setSelectedBadgeCustomer(c)}
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <div
                            className="table-avatar-fallback"
                            onClick={() => setSelectedBadgeCustomer(c)}
                            style={{ cursor: 'pointer' }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                            {c.name}
                          </div>
                          {c.adharNumber && (
                            <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                              Aadhaar: •••• {c.adharNumber.slice(-4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge-qr-token">{c.qrToken}</span>
                    </td>

                    <td>{c.mobile}</td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {c.address || 'Standard Hub Delivery'}
                    </td>

                    {/* Today's Status */}
                    <td>
                      {c.isCompletedToday ? (
                        <div>
                          <span className="badge-status-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={12} />
                            <span>Done: {c.todayDeliveredQty} Units (₹{c.todayDeliveredAmt})</span>
                          </span>
                          {c.lastDeliveryTime && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Delivered at {new Date(c.lastDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge-status-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                          <AlertCircle size={12} />
                          <span>Left for Today (Pending)</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {c.isCompletedToday ? (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => setSelectedGiveMilkCustomer(c)}
                            title="Add extra item for today"
                          >
                            <Package size={12} />
                            <span>Add Extra</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-xs btn-success"
                            style={{ fontWeight: 700 }}
                            onClick={() => setSelectedGiveMilkCustomer(c)}
                            title="Record milk delivery for today"
                          >
                            <Package size={12} />
                            <span>Deliver Milk</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setSelectedBadgeCustomer(c)}
                          title="Print Customer QR Pass"
                        >
                          <Printer size={12} />
                          <span>Pass</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Give Product Modal */}
      {selectedGiveMilkCustomer && (
        <GiveProductModal
          customer={selectedGiveMilkCustomer}
          onClose={() => setSelectedGiveMilkCustomer(null)}
          onTransactionCreated={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* Printable Badge */}
      {selectedBadgeCustomer && (
        <PrintableQrBadge
          customer={selectedBadgeCustomer}
          onClose={() => setSelectedBadgeCustomer(null)}
        />
      )}
    </div>
  );
};
