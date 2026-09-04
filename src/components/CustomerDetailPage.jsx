import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Pagination } from './Pagination';
import { CustomerBillModal } from './CustomerBillModal';
import { GiveProductModal } from './GiveProductModal';
import { PrintableQrBadge } from './PrintableQrBadge';
import {
  ArrowLeft,
  Calendar,
  Package,
  Printer,
  FileText,
  IndianRupee,
  Layers,
  Phone,
  MapPin,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';
import {
  getCurrentMonthRange,
  getMonthOptions,
  formatDateDisplay,
  formatCurrency
} from '../utils/dateUtils';

export const CustomerDetailPage = ({
  customer,
  onBack,
  onEditCustomer
}) => {
  const { showError, showSuccess } = useToast();

  // Modals inside detail page
  const [activeGiveProductCustomer, setActiveGiveProductCustomer] = useState(null);
  const [activeBadgeCustomer, setActiveBadgeCustomer] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [allMonthTransactions, setAllMonthTransactions] = useState([]);
  const [loadingAllForBill, setLoadingAllForBill] = useState(false);

  // Edit Delivery Entry State
  const [editingTx, setEditingTx] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [editTxForm, setEditTxForm] = useState({
    productId: '',
    productName: '',
    unit: 'L',
    priceAtTransaction: 0,
    quantity: 1,
    notes: '',
    createdAt: ''
  });
  const [savingEditTx, setSavingEditTx] = useState(false);

  // Date Filter State - defaults to CURRENT MONTH automatically
  const monthOptions = getMonthOptions(12);
  const [selectedMonthId, setSelectedMonthId] = useState(monthOptions[0]?.id || '');
  const [startDate, setStartDate] = useState(() => getCurrentMonthRange().startDate);
  const [endDate, setEndDate] = useState(() => getCurrentMonthRange().endDate);

  // Pagination for Daily Orders
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ page: 1, limit: 20, totalPages: 1, totalItems: 0 });

  // Data
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalSpent: 0, totalVolume: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch products catalog for editing entries
  useEffect(() => {
    api.getProducts({ limit: 100 })
      .then((res) => {
        if (res.success && res.data?.products) {
          setProductsList(res.data.products);
        }
      })
      .catch(() => {});
  }, []);

  const fetchCustomerTransactions = async () => {
    if (!customer?._id && !customer?.id) return;
    const custId = customer._id || customer.id;

    setLoading(true);
    try {
      const params = {
        page,
        limit
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getCustomerTransactions(custId, params);
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
      showError(err.message || 'Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  };

  // When month dropdown changes
  const handleMonthSelect = (e) => {
    const mId = e.target.value;
    setSelectedMonthId(mId);

    if (mId === 'CUSTOM') {
      return;
    }

    const matched = monthOptions.find((m) => m.id === mId);
    if (matched) {
      setStartDate(matched.startDate);
      setEndDate(matched.endDate);
      setPage(1);
    }
  };

  // Reset filter back to current month
  const handleResetCurrentMonth = () => {
    const range = getCurrentMonthRange();
    setSelectedMonthId(monthOptions[0]?.id || '');
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPage(1);
  };

  // Handle custom date input changes
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setSelectedMonthId('CUSTOM');
    setPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setSelectedMonthId('CUSTOM');
    setPage(1);
  };

  useEffect(() => {
    fetchCustomerTransactions();
  }, [customer, startDate, endDate, page, limit]);

  // Open Full Monthly Bill
  const handleOpenBillModal = async () => {
    if (!customer?._id && !customer?.id) return;
    const custId = customer._id || customer.id;

    setLoadingAllForBill(true);
    try {
      const res = await api.getCustomerTransactions(custId, {
        startDate,
        endDate,
        limit: 1000,
        page: 1
      });
      if (res.success) {
        setAllMonthTransactions(res.data?.transactions || []);
      } else {
        setAllMonthTransactions(transactions);
      }
      setShowBillModal(true);
    } catch (err) {
      setAllMonthTransactions(transactions);
      setShowBillModal(true);
    } finally {
      setLoadingAllForBill(false);
    }
  };

  // Compute product breakdown
  const productTotals = {};
  transactions.forEach((t) => {
    const name = t.productName || t.productId?.name || 'Dairy Product';
    const qty = Number(t.quantity) || 0;
    const amt = Number(t.totalAmount) || 0;
    const unit = t.unit || t.productId?.unit || 'Units';
    if (!productTotals[name]) {
      productTotals[name] = { name, unit, qty: 0, amt: 0 };
    }
    productTotals[name].qty += qty;
    productTotals[name].amt += amt;
  });

  const openEditTxModal = (tx) => {
    setEditingTx(tx);
    const d = new Date(tx.createdAt);
    const pad = (n) => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setEditTxForm({
      productId: tx.productId?._id || tx.productId || '',
      productName: tx.productName || tx.productId?.name || '',
      unit: tx.unit || tx.productId?.unit || 'L',
      priceAtTransaction: tx.priceAtTransaction || tx.productId?.price || 0,
      quantity: tx.quantity || 1,
      notes: tx.notes || '',
      createdAt: localIso
    });
  };

  const handleEditProductChange = (prodId) => {
    const prod = productsList.find((p) => p._id === prodId);
    if (prod) {
      setEditTxForm((prev) => ({
        ...prev,
        productId: prod._id,
        productName: prod.name,
        unit: prod.unit,
        priceAtTransaction: prod.price
      }));
    }
  };

  const handleSaveEditTx = async (e) => {
    e.preventDefault();
    if (!editingTx) return;
    setSavingEditTx(true);
    try {
      const payload = {
        quantity: Number(editTxForm.quantity),
        priceAtTransaction: Number(editTxForm.priceAtTransaction),
        notes: editTxForm.notes,
        ...(editTxForm.productId && { productId: editTxForm.productId }),
        ...(editTxForm.createdAt && { createdAt: new Date(editTxForm.createdAt).toISOString() })
      };
      const res = await api.updateTransaction(editingTx._id, payload);
      if (res.success) {
        showSuccess('Delivery entry updated successfully');
        setEditingTx(null);
        fetchCustomerTransactions();
      }
    } catch (err) {
      showError(err.message || 'Failed to update delivery entry');
    } finally {
      setSavingEditTx(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!editingTx) return;
    if (!window.confirm(`Delete this delivery entry of ${editTxForm.productName} (${editTxForm.quantity} ${editTxForm.unit})?`)) return;
    try {
      const res = await api.deleteTransaction(editingTx._id);
      if (res.success) {
        showSuccess('Delivery entry deleted successfully');
        setEditingTx(null);
        fetchCustomerTransactions();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete entry');
    }
  };

  const selectedMonthObj = monthOptions.find((m) => m.id === selectedMonthId);
  const currentPeriodLabel = selectedMonthObj ? selectedMonthObj.monthName : `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`;

  return (
    <div className="customer-dedicated-page">
      {/* 1. TOP NAVIGATION & BREADCRUMB BAR */}
      <div className="page-nav-bar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-outline back-btn"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            <span>Back to Customers</span>
          </button>

          <div className="breadcrumb-trail">
            <span>Customer Directory</span>
            <ChevronRight size={14} />
            <strong>{customer.name}</strong>
            <span className="badge-qr-token" style={{ marginLeft: '0.35rem' }}>{customer.qrToken}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={handleOpenBillModal}
            disabled={loadingAllForBill}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
          >
            <FileText size={15} />
            <span>{loadingAllForBill ? 'Preparing Bill...' : 'Generate Monthly Bill'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={() => setActiveGiveProductCustomer(customer)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Package size={14} />
            <span>Give Milk</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setActiveBadgeCustomer(customer)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={14} />
            <span>Print ID Pass</span>
          </button>

          {onEditCustomer && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onEditCustomer(customer)}
              title="Edit customer details"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DEDICATED CUSTOMER IDENTITY PROFILE HERO */}
      <div className="customer-profile-hero card-surface">
        <div className="profile-hero-grid">
          {/* Avatar & Core Meta */}
          <div className="hero-identity-box">
            {customer.image || customer.profileImage ? (
              <img
                src={customer.image || customer.profileImage}
                alt={customer.name}
                className="hero-avatar-image"
              />
            ) : (
              <div className="hero-avatar-fallback">
                {customer.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="hero-names-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 className="hero-customer-title">{customer.name}</h2>
                <span className={customer.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                  {customer.status}
                </span>
              </div>

              <div className="hero-token-row">
                <span className="badge-qr-token" style={{ fontSize: '0.85rem' }}>{customer.qrToken}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• Registered Milk Recipient</span>
              </div>
            </div>
          </div>

          {/* Detailed Badges & Route Details */}
          <div className="hero-details-card">
            <div className="hero-detail-item">
              <span className="hero-detail-label"><Phone size={12} /> Mobile Phone</span>
              <strong className="hero-detail-val">{customer.mobile}</strong>
            </div>

            <div className="hero-detail-item">
              <span className="hero-detail-label"><MapPin size={12} /> Delivery Address</span>
              <strong className="hero-detail-val">{customer.address || 'Standard Hub Delivery Point'}</strong>
            </div>

            <div className="hero-detail-item">
              <span className="hero-detail-label"><ShieldCheck size={12} /> Assigned Route Admin</span>
              <strong className="hero-detail-val" style={{ color: 'var(--primary-red)' }}>
                {customer.adminId?.name || 'Unassigned Hub'}
              </strong>
            </div>

            {customer.adharNumber && (
              <div className="hero-detail-item">
                <span className="hero-detail-label">Aadhaar Card</span>
                <strong className="hero-detail-val" style={{ color: '#15803d' }}>
                  •••• •••• {customer.adharNumber.slice(-4)}
                </strong>
              </div>
            )}

            {customer.panNumber && (
              <div className="hero-detail-item">
                <span className="hero-detail-label">PAN Number</span>
                <strong className="hero-detail-val" style={{ color: '#0369a1' }}>
                  {customer.panNumber}
                </strong>
              </div>
            )}
          </div>

          {/* QR Code Pass Quick Tile */}
          {customer.qrCode && (
            <div className="hero-qr-tile">
              <div className="hero-qr-frame">
                <img src={customer.qrCode} alt={`QR for ${customer.name}`} style={{ width: '90px', height: '90px' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-heading)' }}>CUSTOMER PASS</span>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => setActiveBadgeCustomer(customer)}
                  style={{ marginTop: '0.25rem', width: '100%', fontSize: '0.68rem', padding: '0.2rem' }}
                >
                  <Printer size={10} />
                  <span>Print Pass</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. DATE & MONTH FILTER TOOLBAR (DEFAULT TO CURRENT MONTH) */}
      <div className="card-surface" style={{ marginTop: '1.25rem' }}>
        <div className="card-surface-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div className="card-surface-title">
              <Calendar size={17} />
              <span>Monthly Orders & Consumption Ledger</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Showing deliveries for:</span>
              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 8px', borderRadius: '12px', fontWeight: 700 }}>
                {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
              </span>
              <span>• Current Month Default</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={handleOpenBillModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
            >
              <FileText size={14} />
              <span>Generate Monthly Bill</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={fetchCustomerTransactions}
              title="Refresh transaction history"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Month & Date Toolbar */}
        <div className="filter-toolbar no-print">
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%' }}>
            {/* Quick Month Select Dropdown */}
            <div>
              <label className="filter-field-label">
                <Calendar size={12} />
                <span>Billing Month</span>
              </label>
              <select
                className="form-control form-control-sm"
                style={{ minWidth: '190px', fontWeight: 600 }}
                value={selectedMonthId}
                onChange={handleMonthSelect}
              >
                {monthOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
                <option value="CUSTOM">Custom Date Range...</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="filter-field-label">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={handleStartDateChange}
              />
            </div>

            {/* To Date */}
            <div>
              <label className="filter-field-label">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={handleEndDateChange}
              />
            </div>

            {/* Reset to Current Month */}
            <div style={{ marginBottom: '2px' }}>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={handleResetCurrentMonth}
                title="Reset to current month dates"
              >
                <RefreshCw size={11} />
                <span>Current Month</span>
              </button>
            </div>

            {/* Active Period Pill */}
            <div className="filter-active-pill" style={{ marginLeft: 'auto', marginBottom: '4px' }}>
              <span>Period:</span>
              <strong>{formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}</strong>
            </div>
          </div>
        </div>

        {/* 4. FINANCIAL & VOLUME SUMMARY KPI CARDS */}
        <div style={{ padding: '0 1.25rem 1rem 1.25rem' }}>
          <div className="monthly-kpi-cards" style={{ marginBottom: '0.85rem' }}>
            <div className="month-kpi-card kpi-card-green">
              <div className="kpi-card-icon green">
                <IndianRupee size={22} />
              </div>
              <div>
                <span className="kpi-card-title">Total Billable Amount</span>
                <div className="kpi-card-val">{formatCurrency(summary.totalSpent || 0)}</div>
                <span className="kpi-card-sub">Period Total for {currentPeriodLabel}</span>
              </div>
            </div>

            <div className="month-kpi-card kpi-card-purple">
              <div className="kpi-card-icon purple">
                <Layers size={22} />
              </div>
              <div>
                <span className="kpi-card-title">Total Volume Delivered</span>
                <div className="kpi-card-val">
                  {(Number(summary.totalVolume) || 0).toFixed(2)}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Units / Litres</span>
                </div>
                <span className="kpi-card-sub">Daily dairy supply quantity</span>
              </div>
            </div>

            <div className="month-kpi-card kpi-card-amber">
              <div className="kpi-card-icon amber">
                <Calendar size={22} />
              </div>
              <div>
                <span className="kpi-card-title">Active Delivery Days</span>
                <div className="kpi-card-val">{meta.totalItems || summary.totalTransactions || 0} Entries</div>
                <span className="kpi-card-sub">Total verified delivery records</span>
              </div>
            </div>
          </div>

          {/* PRODUCT BREAKDOWN ROW */}
          {Object.keys(productTotals).length > 0 && (
            <div className="product-breakdown-row">
              <span className="breakdown-label">Month Product Summary:</span>
              <div className="breakdown-chips">
                {Object.values(productTotals).map((p, idx) => (
                  <span key={`p-${idx}`} className="breakdown-chip">
                    <strong>{p.name}:</strong> {p.qty} {p.unit} ({formatCurrency(p.amt)})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5. DAILY ORDERS LEDGER TABLE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.5rem 0' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Package size={15} />
              <span>Daily Milk & Product Deliveries ({meta.totalItems || 0})</span>
            </h4>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-xs btn-success"
                onClick={() => setActiveGiveProductCustomer(customer)}
              >
                <Package size={12} />
                <span>Record New Delivery</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="ledger-loading-box">
              <RefreshCw className="spinner" size={24} />
              <span>Fetching customer orders for {currentPeriodLabel}...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-ledger-box">
              <Calendar size={40} color="var(--text-dim)" />
              <p style={{ fontWeight: 700, margin: '0.5rem 0 0.2rem 0', fontSize: '1rem' }}>No deliveries recorded for this month</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No milk or product distributions logged between {formatDateDisplay(startDate)} and {formatDateDisplay(endDate)}.
              </p>
              <button
                type="button"
                className="btn btn-xs btn-success"
                style={{ marginTop: '0.5rem' }}
                onClick={() => setActiveGiveProductCustomer(customer)}
              >
                <Package size={12} />
                <span>Give Milk Today</span>
              </button>
            </div>
          ) : (
            <div className="table-responsive" style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}>
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>S.No.</th>
                    <th>Delivery Date & Time</th>
                    <th>Product Delivered</th>
                    <th style={{ textAlign: 'right' }}>Unit Rate</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Delivered By (Route)</th>
                    <th>Remarks / Notes</th>
                    <th style={{ textAlign: 'right', width: '85px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={t._id}>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{formatDateDisplay(t.createdAt)}</strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{t.productName || t.productId?.name || 'Milk'}</div>
                        <span className="badge-cat" style={{ fontSize: '0.65rem' }}>
                          {t.productId?.category || 'Dairy Supply'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(t.priceAtTransaction || t.productId?.price || 0)} / {t.unit || 'L'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge-qty">
                          {t.quantity} {t.unit || t.productId?.unit || 'L'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge-total-amt">
                          {formatCurrency(t.totalAmount)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t.adminId?.name || 'Route Admin'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '160px' }}>
                        {t.notes || '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => openEditTxModal(t)}
                          title="Edit this delivery entry"
                          style={{ padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: '#cbd5e1' }}
                        >
                          <Edit2 size={11} color="var(--primary-red)" />
                          <span style={{ fontWeight: 600 }}>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          <div style={{ marginTop: '0.85rem' }}>
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
      </div>

      {/* EDIT DELIVERY ENTRY MODAL */}
      {editingTx && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                <Edit2 size={16} />
                <span>Edit Daily Delivery Entry</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setEditingTx(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTx}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', border: '1px solid var(--border-medium)' }}>
                  <div><strong>Customer:</strong> {customer.name} (<code>{customer.qrToken}</code>)</div>
                  <div><strong>Entry ID:</strong> <code style={{ fontSize: '0.72rem' }}>{editingTx._id}</code></div>
                </div>

                {/* Delivery Date & Time */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Delivery Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={editTxForm.createdAt}
                    onChange={(e) => setEditTxForm({ ...editTxForm, createdAt: e.target.value })}
                    required
                  />
                </div>

                {/* Product Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Product Supplied *
                  </label>
                  <select
                    className="form-control"
                    value={editTxForm.productId}
                    onChange={(e) => handleEditProductChange(e.target.value)}
                    required
                  >
                    {productsList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.unit}) — Rate: ₹{p.price}/{p.unit}
                      </option>
                    ))}
                    {!productsList.some((p) => p._id === editTxForm.productId) && (
                      <option value={editTxForm.productId}>
                        {editTxForm.productName} ({editTxForm.unit})
                      </option>
                    )}
                  </select>
                </div>

                {/* Quantity & Unit Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Quantity ({editTxForm.unit}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      value={editTxForm.quantity}
                      onChange={(e) => setEditTxForm({ ...editTxForm, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Unit Rate (₹ / {editTxForm.unit}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={editTxForm.priceAtTransaction}
                      onChange={(e) => setEditTxForm({ ...editTxForm, priceAtTransaction: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Live Total Calculation Card */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>Calculated Total:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d' }}>
                    {formatCurrency((Number(editTxForm.quantity) || 0) * (Number(editTxForm.priceAtTransaction) || 0))}
                  </span>
                </div>

                {/* Remarks / Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Remarks / Notes
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Morning distribution adjustment"
                    value={editTxForm.notes}
                    onChange={(e) => setEditTxForm({ ...editTxForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-danger-outline"
                  onClick={handleDeleteTx}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Trash2 size={13} />
                  <span>Delete Entry</span>
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditingTx(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-success"
                    disabled={savingEditTx}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                  >
                    <CheckCircle2 size={14} />
                    <span>{savingEditTx ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showBillModal && (
        <CustomerBillModal
          customer={customer}
          transactions={allMonthTransactions}
          summary={summary}
          startDate={startDate}
          endDate={endDate}
          selectedMonthLabel={currentPeriodLabel}
          onClose={() => setShowBillModal(false)}
        />
      )}

      {activeGiveProductCustomer && (
        <GiveProductModal
          customer={activeGiveProductCustomer}
          onClose={() => setActiveGiveProductCustomer(null)}
          onTransactionCreated={() => {
            fetchCustomerTransactions();
            showSuccess('Transaction recorded and added to billing ledger');
          }}
        />
      )}

      {activeBadgeCustomer && (
        <PrintableQrBadge
          customer={activeBadgeCustomer}
          onClose={() => setActiveBadgeCustomer(null)}
        />
      )}
    </div>
  );
};
