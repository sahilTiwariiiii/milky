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
  Eye
} from 'lucide-react';

export const SuperAdminDashboard = ({ onNavigate, onOpenScanner }) => {
  const { user, isSuperAdmin } = useAuth();
  const { showError } = useToast();

  const [stats, setStats] = useState({
    customersCount: 0,
    adminsCount: 0,
    productsCount: 0,
    transactionsCount: 0,
    totalRevenue: 0,
    totalVolume: 0
  });
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState('ALL');

  // Modals
  const [selectedGiveProductCustomer, setSelectedGiveProductCustomer] = useState(null);
  const [selectedBadgeCustomer, setSelectedBadgeCustomer] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [custRes, prodRes, txRes] = await Promise.all([
        api.getCustomers({ limit: 20 }),
        api.getProducts({ limit: 100 }),
        api.getTransactions({ limit: 20 })
      ]);

      let adminsCount = 0;
      if (isSuperAdmin) {
        const adminRes = await api.getAdmins({ limit: 100 }).catch(() => ({}));
        adminsCount = adminRes.data?.meta?.totalItems || adminRes.data?.admins?.length || 0;
      }

      setStats({
        customersCount: custRes.data?.meta?.totalItems || custRes.data?.customers?.length || 0,
        adminsCount,
        productsCount: prodRes.data?.products?.length || 0,
        transactionsCount: txRes.data?.summary?.totalTransactions || 0,
        totalRevenue: txRes.data?.summary?.totalRevenue || 0,
        totalVolume: txRes.data?.summary?.totalVolume || 0
      });

      if (custRes.data?.customers) setCustomers(custRes.data.customers);
      if (txRes.data?.transactions) setTransactions(txRes.data.transactions);
    } catch (err) {
      showError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user, isSuperAdmin]);

  return (
    <div>
      {/* 1. ENTERPRISE KPI TILES (Compact) */}
      <div className="enterprise-kpi-grid">
        <div className="kpi-tile kpi-green" onClick={() => onNavigate('transactions')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-box kpi-icon-green">
            <IndianRupee size={18} />
          </div>
          <div>
            <div className="kpi-title">Total Revenue</div>
            <div className="kpi-number">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="kpi-tile kpi-blue" onClick={() => onNavigate('customers')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-box kpi-icon-blue">
            <Users size={18} />
          </div>
          <div>
            <div className="kpi-title">{isSuperAdmin ? 'Total Customers' : 'Route Customers'}</div>
            <div className="kpi-number">{stats.customersCount}</div>
          </div>
        </div>

        <div className="kpi-tile kpi-purple" onClick={() => onNavigate('transactions')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-box kpi-icon-purple">
            <Layers size={18} />
          </div>
          <div>
            <div className="kpi-title">Volume Distributed</div>
            <div className="kpi-number">{stats.totalVolume} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Units</span></div>
          </div>
        </div>

        <div className="kpi-tile kpi-amber" onClick={() => onNavigate('products')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-box kpi-icon-amber">
            <Package size={18} />
          </div>
          <div>
            <div className="kpi-title">Catalog Products</div>
            <div className="kpi-number">{stats.productsCount}</div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="kpi-tile kpi-brown" onClick={() => onNavigate('admins')} style={{ cursor: 'pointer' }}>
            <div className="kpi-icon-box kpi-icon-brown">
              <UserCheck size={18} />
            </div>
            <div>
              <div className="kpi-title">Delivery Admins</div>
              <div className="kpi-number">{stats.adminsCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. ENTERPRISE PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <ReceiptText size={16} />
            <span>Distribution & Customer Registry</span>
          </h3>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              style={{ background: '#fff', color: 'var(--primary-red)' }}
              onClick={onOpenScanner}
            >
              <QrCode size={12} />
              <span>QR Scanner Terminal</span>
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
            className={`sub-tab-btn ${activeSubTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('ALL')}
          >
            Registered Customers with QR ({customers.length})
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'TRANSACTIONS' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('TRANSACTIONS')}
          >
            Distribution Ledger Logs ({transactions.length})
          </button>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading enterprise records...
          </div>
        ) : activeSubTab === 'ALL' ? (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Customer QR Pass</th>
                  <th>Customer Name</th>
                  <th>Mobile Phone</th>
                  <th>Delivery Address</th>
                  <th>Route Admin</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Process / Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {c.qrCode && (
                          <img
                            src={c.qrCode}
                            alt={`QR for ${c.name}`}
                            className="table-qr-thumb"
                            title="Click to view Pass"
                            onClick={() => setSelectedBadgeCustomer(c)}
                          />
                        )}
                        <span className="badge-qr-token">{c.qrToken}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                      {c.name}
                    </td>
                    <td>{c.mobile}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{c.address || 'Standard Hub'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-red)' }}>
                      {c.adminId?.name || 'Unassigned'}
                    </td>
                    <td>
                      <span className={c.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-success"
                          onClick={() => setSelectedGiveProductCustomer(c)}
                        >
                          <Package size={12} />
                          <span>Give Milk</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setSelectedBadgeCustomer(c)}
                          title="Print Customer QR Pass"
                        >
                          <Printer size={12} />
                          <span>QR Pass</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>QR Token</th>
                  <th>Admin Staff</th>
                  <th>Product & Quantity</th>
                  <th>Price at Sale</th>
                  <th>Total Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ fontWeight: 700 }}>{tx.customerId?.name || 'Customer'}</td>
                    <td><span className="badge-qr-token">{tx.customerId?.qrToken || 'N/A'}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-red)' }}>{tx.adminId?.name || 'Admin'}</td>
                    <td style={{ fontWeight: 700 }}>{tx.quantity} {tx.unit} {tx.productName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>₹{tx.priceAtTransaction}/{tx.unit}</td>
                    <td style={{ fontWeight: 800, color: '#15803d' }}>₹{tx.totalAmount}</td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{tx.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Give Product Modal */}
      {selectedGiveProductCustomer && (
        <GiveProductModal
          customer={selectedGiveProductCustomer}
          onClose={() => setSelectedGiveProductCustomer(null)}
          onTransactionCreated={() => {
            fetchDashboard();
          }}
        />
      )}

      {/* Printable Badge Modal */}
      {selectedBadgeCustomer && (
        <PrintableQrBadge
          customer={selectedBadgeCustomer}
          onClose={() => setSelectedBadgeCustomer(null)}
        />
      )}
    </div>
  );
};
