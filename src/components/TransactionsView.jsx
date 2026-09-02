import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ReceiptText,
  Calendar,
  IndianRupee,
  Layers,
  Printer,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const TransactionsView = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showError } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalVolume: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [adminsList, setAdminsList] = useState([]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedAdminId) params.adminId = selectedAdminId;

      const res = await api.getTransactions(params);
      if (res.success) {
        setTransactions(res.data.transactions || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      api.getAdmins({ limit: 100 }).then((res) => {
        if (res.success && res.data?.admins) {
          setAdminsList(res.data.admins);
        }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, selectedAdminId, user]);

  return (
    <div>
      {/* 1. FINANCIAL SUMMARY KPI TILES (Image 2 style) */}
      <div className="enterprise-kpi-grid">
        <div className="kpi-tile kpi-green">
          <div className="kpi-icon-box kpi-icon-green">
            <IndianRupee size={22} />
          </div>
          <div>
            <div className="kpi-title">Total Revenue Collection</div>
            <div className="kpi-number">₹{summary.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="kpi-tile kpi-purple">
          <div className="kpi-icon-box kpi-icon-purple">
            <Layers size={22} />
          </div>
          <div>
            <div className="kpi-title">Total Volume Delivered</div>
            <div className="kpi-number">{summary.totalVolume} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Units</span></div>
          </div>
        </div>

        <div className="kpi-tile kpi-blue">
          <div className="kpi-icon-box kpi-icon-blue">
            <ReceiptText size={22} />
          </div>
          <div>
            <div className="kpi-title">Transactions Recorded</div>
            <div className="kpi-number">{summary.totalTransactions}</div>
          </div>
        </div>
      </div>

      {/* 2. ENTERPRISE LEDGER PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <ReceiptText size={18} />
            <span>Distribution Billing Ledger & Audit Trail</span>
          </h3>

          <button
            type="button"
            className="btn btn-xs btn-outline no-print"
            style={{ background: '#fff', color: 'var(--primary-red)' }}
            onClick={() => window.print()}
          >
            <Printer size={13} />
            <span>Print Ledger</span>
          </button>
        </div>

        {/* Toolbar with Filters */}
        <div className="panel-toolbar no-print">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>From:</span>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>To:</span>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {isSuperAdmin && (
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '180px', padding: '0.35rem 0.65rem' }}
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
              >
                <option value="">All Route Admins (Global)</option>
                {adminsList.map((a) => (
                  <option key={a._id} value={a._id}>
                    Admin: {a.name}
                  </option>
                ))}
              </select>
            )}

            {(startDate || endDate || selectedAdminId) && (
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedAdminId('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading ledger transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No distribution records found for this selection.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Date & Time</th>
                  <th>Customer Name</th>
                  <th>QR Token</th>
                  {isSuperAdmin && <th>Recorded By Admin</th>}
                  <th>Product & Quantity</th>
                  <th>Snapshot Unit Price</th>
                  <th>Total Amount</th>
                  <th>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={tx._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                      {tx.customerId?.name || 'Customer'}
                    </td>
                    <td>
                      <span className="badge-qr-token">{tx.customerId?.qrToken || 'N/A'}</span>
                    </td>

                    {isSuperAdmin && (
                      <td style={{ fontWeight: 600, color: 'var(--primary-red)' }}>
                        {tx.adminId?.name || 'Admin'}
                      </td>
                    )}

                    <td>
                      <span style={{ fontWeight: 700 }}>{tx.quantity} {tx.unit}</span> {tx.productName}
                    </td>

                    <td style={{ color: 'var(--text-muted)' }}>
                      ₹{tx.priceAtTransaction} / {tx.unit}
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#15803d' }}>
                        ₹{tx.totalAmount}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {tx.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
