import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from './Pagination';
import {
  getCurrentMonthRange,
  getMonthOptions,
  formatDateDisplay
} from '../utils/dateUtils';
import {
  ReceiptText,
  Calendar,
  IndianRupee,
  Layers,
  Printer,
  Search,
  Filter,
  Package,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const TransactionsView = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showError } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalVolume: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ page: 1, limit: 20, totalPages: 1, totalItems: 0 });

  // Filters - default to CURRENT MONTH
  const monthOptions = getMonthOptions(12);
  const [selectedMonthId, setSelectedMonthId] = useState(monthOptions[0]?.id || '');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(() => getCurrentMonthRange().startDate);
  const [endDate, setEndDate] = useState(() => getCurrentMonthRange().endDate);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adminsList, setAdminsList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit
      };
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedAdminId) params.adminId = selectedAdminId;
      if (selectedProductId) params.productId = selectedProductId;

      const res = await api.getTransactions(params);
      if (res.success) {
        setTransactions(res.data?.transactions || []);
        if (res.data?.summary) {
          setSummary(res.data.summary);
        }
        if (res.meta) {
          setMeta(res.meta);
        } else {
          setMeta({
            page,
            limit,
            totalPages: Math.ceil((res.data?.summary?.totalTransactions || 1) / limit) || 1,
            totalItems: res.data?.summary?.totalTransactions || res.data?.transactions?.length || 0
          });
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

    api.getProducts({ limit: 100 }).then((res) => {
      if (res.success && res.data?.products) {
        setProductsList(res.data.products);
      }
    }).catch(() => {});
  }, [isSuperAdmin]);

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate, selectedAdminId, selectedProductId]);

  useEffect(() => {
    fetchTransactions();
  }, [page, limit, search, startDate, endDate, selectedAdminId, selectedProductId, user]);

  const resetFilters = () => {
    const range = getCurrentMonthRange();
    setSelectedMonthId(monthOptions[0]?.id || '');
    setSearch('');
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setSelectedAdminId('');
    setSelectedProductId('');
  };

  const clearAllFilters = () => {
    setSelectedMonthId('ALL_TIME');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setSelectedAdminId('');
    setSelectedProductId('');
  };

  return (
    <div>
      {/* 1. FINANCIAL SUMMARY KPI TILES */}
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
            <div className="kpi-title">Total Transactions Logged</div>
            <div className="kpi-number">{summary.totalTransactions}</div>
          </div>
        </div>
      </div>

      {/* 2. TRANSACTIONS LEDGER TABLE CARD */}
      <div className="card-surface">
        <div className="card-surface-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="card-surface-title">
              <ReceiptText size={16} />
              <span>Distribution Billing Ledger & Audit Trail</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Period:</span>
              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 8px', borderRadius: '12px', fontWeight: 700 }}>
                {startDate && endDate ? `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}` : startDate ? `From ${formatDateDisplay(startDate)}` : endDate ? `Up to ${formatDateDisplay(endDate)}` : 'All Time'}
              </span>
              <span>• Default Current Month Active</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={fetchTransactions}
              title="Refresh ledger records"
            >
              <RefreshCw size={13} />
              <span>Refresh Ledger</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => window.print()}
              title="Print ledger report"
            >
              <Printer size={13} />
              <span>Print Ledger</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="filter-toolbar no-print">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search Customer, Mobile, Token, or Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2rem' }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>

            {/* Quick Month Dropdown (Default to Current Month) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>Month:</span>
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '180px', padding: '0.35rem 0.65rem', fontWeight: 600 }}
                value={selectedMonthId}
                onChange={(e) => {
                  const mId = e.target.value;
                  setSelectedMonthId(mId);
                  if (mId === 'ALL_TIME') {
                    setStartDate('');
                    setEndDate('');
                  } else if (mId === 'CUSTOM') {
                    // custom date pickers
                  } else {
                    const matched = monthOptions.find((m) => m.id === mId);
                    if (matched) {
                      setStartDate(matched.startDate);
                      setEndDate(matched.endDate);
                    }
                  }
                }}
              >
                {monthOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
                <option value="CUSTOM">Custom Date Range...</option>
                <option value="ALL_TIME">All Time (No Date Filter)</option>
              </select>
            </div>

            {/* From Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>From:</span>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedMonthId('CUSTOM');
                }}
              />
            </div>

            {/* To Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>To:</span>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedMonthId('CUSTOM');
                }}
              />
            </div>

            {/* Product Filter */}
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px', padding: '0.35rem 0.65rem' }}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">All Dairy Products</option>
              {productsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Admin Filter (for Superadmin) */}
            {isSuperAdmin && (
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '180px', padding: '0.35rem 0.65rem' }}
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
              >
                <option value="">All Delivery Admins</option>
                {adminsList.map((a) => (
                  <option key={a._id} value={a._id}>
                    Route: {a.name}
                  </option>
                ))}
              </select>
            )}

            {/* Reset & All-Time Actions */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={resetFilters}
                title="Reset back to current month"
              >
                <RefreshCw size={11} />
                <span>Current Month</span>
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={clearAllFilters}
                  title="Show all-time transactions without date limits"
                >
                  <span>All Time</span>
                </button>
              )}
            </div>
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
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                      {(page - 1) * limit + idx + 1}
                    </td>
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

        {/* Pagination Controls */}
        <Pagination
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};
