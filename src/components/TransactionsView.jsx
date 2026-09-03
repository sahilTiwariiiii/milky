import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from './Pagination';
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

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

        {/* Toolbar with Comprehensive Filters */}
        <div className="panel-toolbar no-print">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
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

            {/* From Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
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

            {/* To Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>To:</span>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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

            {/* Reset Button */}
            {(search || startDate || endDate || selectedAdminId || selectedProductId) && (
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={resetFilters}
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
