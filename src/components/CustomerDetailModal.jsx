import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Pagination } from './Pagination';
import { CustomerBillModal } from './CustomerBillModal';
import {
  X,
  Calendar,
  Package,
  Printer,
  QrCode,
  FileText,
  IndianRupee,
  Layers,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  User,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import {
  getCurrentMonthRange,
  getMonthOptions,
  formatDateDisplay,
  formatDateTimeDisplay,
  formatCurrency
} from '../utils/dateUtils';

export const CustomerDetailModal = ({
  customer,
  onClose,
  onOpenGiveMilk,
  onOpenPrintPass
}) => {
  const { showError } = useToast();

  // Active Tab: 'ORDERS' | 'IDENTITY'
  const [activeTab, setActiveTab] = useState('ORDERS');

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

  // Full Month Bill Modal state
  const [showBillModal, setShowBillModal] = useState(false);
  const [allMonthTransactions, setAllMonthTransactions] = useState([]);
  const [loadingAllForBill, setLoadingAllForBill] = useState(false);

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

  // When filter dates or pagination change
  useEffect(() => {
    fetchCustomerTransactions();
  }, [customer, startDate, endDate, page, limit]);

  // Open Full Monthly Bill
  const handleOpenBillModal = async () => {
    if (!customer?._id && !customer?.id) return;
    const custId = customer._id || customer.id;

    setLoadingAllForBill(true);
    try {
      // Fetch up to 1000 transactions for the full month so every day is on the invoice
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
      // Fallback to currently loaded transactions
      setAllMonthTransactions(transactions);
      setShowBillModal(true);
    } finally {
      setLoadingAllForBill(false);
    }
  };

  // Compute product breakdown
  const productTotals = {};
  transactions.forEach((t) => {
    const name = t.productName || t.productId?.name || 'Dairy';
    const qty = Number(t.quantity) || 0;
    const amt = Number(t.totalAmount) || 0;
    const unit = t.unit || t.productId?.unit || 'Units';
    if (!productTotals[name]) {
      productTotals[name] = { name, unit, qty: 0, amt: 0 };
    }
    productTotals[name].qty += qty;
    productTotals[name].amt += amt;
  });

  const selectedMonthObj = monthOptions.find((m) => m.id === selectedMonthId);
  const currentPeriodLabel = selectedMonthObj ? selectedMonthObj.monthName : `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`;

  return (
    <>
      <div className="modal-overlay customer-detail-overlay">
        <div className="modal-content customer-detail-modal-content">
          {/* MODAL HEADER */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="avatar-header-pill">
                {customer.image || customer.profileImage ? (
                  <img
                    src={customer.image || customer.profileImage}
                    alt={customer.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  {customer.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span className="badge-qr-token">{customer.qrToken}</span>
                  <span>•</span>
                  <span>{customer.mobile}</span>
                  <span>•</span>
                  <span className={customer.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                    {customer.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={handleOpenBillModal}
                disabled={loadingAllForBill}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <FileText size={14} />
                <span>{loadingAllForBill ? 'Preparing Bill...' : 'Generate Monthly Bill'}</span>
              </button>

              <button
                type="button"
                className="close-btn"
                onClick={onClose}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* QUICK SUMMARY STRIP */}
          <div className="customer-info-strip">
            <div className="info-strip-col">
              <span className="strip-label"><Phone size={11} /> Mobile Phone</span>
              <strong className="strip-val">{customer.mobile}</strong>
            </div>
            <div className="info-strip-col">
              <span className="strip-label"><MapPin size={11} /> Delivery Address</span>
              <strong className="strip-val">{customer.address || 'Standard Delivery Hub'}</strong>
            </div>
            <div className="info-strip-col">
              <span className="strip-label"><ShieldCheck size={11} /> Route Admin</span>
              <strong className="strip-val" style={{ color: 'var(--primary-red)' }}>
                {customer.adminId?.name || 'Assigned Admin'}
              </strong>
            </div>
            {customer.adharNumber && (
              <div className="info-strip-col">
                <span className="strip-label">Aadhaar Card</span>
                <strong className="strip-val">•••• {customer.adharNumber.slice(-4)}</strong>
              </div>
            )}
            {customer.panNumber && (
              <div className="info-strip-col">
                <span className="strip-label">PAN Number</span>
                <strong className="strip-val">{customer.panNumber}</strong>
              </div>
            )}
          </div>

          {/* VIEW SUBTABS */}
          <div className="customer-modal-tabs">
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'ORDERS' ? 'active' : ''}`}
              onClick={() => setActiveTab('ORDERS')}
            >
              <Calendar size={14} />
              <span>Daily Orders & Monthly Bill Ledger</span>
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'IDENTITY' ? 'active' : ''}`}
              onClick={() => setActiveTab('IDENTITY')}
            >
              <QrCode size={14} />
              <span>QR ID Pass & Identity Card</span>
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="modal-body" style={{ padding: '1.25rem' }}>
            {activeTab === 'ORDERS' ? (
              <div>
                {/* 1. AUTOMATIC MONTH SELECTOR & DATE RANGE FILTER */}
                <div className="month-filter-toolbar">
                  <div className="filter-group">
                    <label className="filter-field-label">
                      <Calendar size={12} />
                      <span>Select Billing Month</span>
                    </label>
                    <select
                      className="form-control form-control-sm month-select-dropdown"
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

                  <div className="filter-group">
                    <label className="filter-field-label">From Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={startDate}
                      onChange={handleStartDateChange}
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-field-label">To Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={endDate}
                      onChange={handleEndDateChange}
                    />
                  </div>

                  <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={handleResetCurrentMonth}
                      title="Reset back to current month"
                    >
                      <RefreshCw size={12} />
                      <span>Reset to Current Month</span>
                    </button>
                  </div>

                  <div className="filter-active-pill" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                    <span>Active Period:</span>
                    <strong>{formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}</strong>
                  </div>
                </div>

                {/* 2. MONTHLY FINANCIAL & VOLUME KPI CARDS */}
                <div className="monthly-kpi-cards">
                  <div className="month-kpi-card kpi-card-green">
                    <div className="kpi-card-icon green">
                      <IndianRupee size={20} />
                    </div>
                    <div>
                      <span className="kpi-card-title">Total Billable Amount</span>
                      <div className="kpi-card-val">{formatCurrency(summary.totalSpent || 0)}</div>
                      <span className="kpi-card-sub">For {currentPeriodLabel}</span>
                    </div>
                  </div>

                  <div className="month-kpi-card kpi-card-purple">
                    <div className="kpi-card-icon purple">
                      <Layers size={20} />
                    </div>
                    <div>
                      <span className="kpi-card-title">Total Volume Delivered</span>
                      <div className="kpi-card-val">
                        {(Number(summary.totalVolume) || 0).toFixed(2)}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Units / Litres</span>
                      </div>
                      <span className="kpi-card-sub">Accurate delivery volume</span>
                    </div>
                  </div>

                  <div className="month-kpi-card kpi-card-amber">
                    <div className="kpi-card-icon amber">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <span className="kpi-card-title">Active Delivery Days</span>
                      <div className="kpi-card-val">{meta.totalItems || summary.totalTransactions || 0} Days</div>
                      <span className="kpi-card-sub">Delivery audit verified</span>
                    </div>
                  </div>
                </div>

                {/* PRODUCT BREAKDOWN PILLS */}
                {Object.keys(productTotals).length > 0 && (
                  <div className="product-breakdown-row">
                    <span className="breakdown-label">Product Breakdown:</span>
                    <div className="breakdown-chips">
                      {Object.values(productTotals).map((p, idx) => (
                        <span key={`p-${idx}`} className="breakdown-chip">
                          <strong>{p.name}:</strong> {p.qty} {p.unit} ({formatCurrency(p.amt)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. DAILY ORDERS TABLE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.5rem 0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={15} />
                    <span>Daily Milk & Product Deliveries ({meta.totalItems || 0})</span>
                  </h4>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-xs btn-success"
                      onClick={() => onOpenGiveMilk?.(customer)}
                    >
                      <Package size={12} />
                      <span>Record Delivery</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={handleOpenBillModal}
                    >
                      <Printer size={12} />
                      <span>View Printable Bill</span>
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
                    <Calendar size={36} color="var(--text-dim)" />
                    <p style={{ fontWeight: 700, margin: '0.5rem 0 0.2rem 0' }}>No deliveries found for this month</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No milk or product transactions recorded between {formatDateDisplay(startDate)} and {formatDateDisplay(endDate)}.
                    </p>
                    <button
                      type="button"
                      className="btn btn-xs btn-success"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => onOpenGiveMilk?.(customer)}
                    >
                      <Package size={12} />
                      <span>Give Milk Today</span>
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Product</th>
                          <th>Unit Rate</th>
                          <th>Quantity</th>
                          <th>Total Amount</th>
                          <th>Route Admin</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t) => (
                          <tr key={t._id}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <strong>{formatDateDisplay(t.createdAt)}</strong>
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{t.productName || t.productId?.name || 'Milk'}</div>
                              <span className="badge-cat" style={{ fontSize: '0.65rem' }}>
                                {t.productId?.category || 'Daily Supply'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {formatCurrency(t.priceAtTransaction || t.productId?.price || 0)} / {t.unit || 'L'}
                            </td>
                            <td>
                              <span className="badge-qty">
                                {t.quantity} {t.unit || t.productId?.unit || 'L'}
                              </span>
                            </td>
                            <td>
                              <span className="badge-total-amt">
                                {formatCurrency(t.totalAmount)}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {t.adminId?.name || 'Route Admin'}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '140px' }}>
                              {t.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGINATION BAR FOR ORDERS */}
                <div style={{ marginTop: '0.75rem' }}>
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
            ) : (
              /* IDENTITY & QR PASS TAB */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', justifyContent: 'center' }}>
                  {customer.image || customer.profileImage ? (
                    <img
                      src={customer.image || customer.profileImage}
                      alt={customer.name}
                      style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '2px solid var(--border-medium)' }}
                    />
                  ) : (
                    <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-sm)', background: '#f5ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontWeight: 800, fontSize: '2.5rem' }}>
                      {customer.name?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {customer.qrCode && (
                    <div style={{
                      background: '#ffffff',
                      border: '2px solid var(--primary-red)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <img
                        src={customer.qrCode}
                        alt={`QR for ${customer.name}`}
                        style={{ width: '120px', height: '120px' }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-heading)', margin: 0 }}>
                    {customer.name}
                  </h4>
                  <div className="badge-qr-token" style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.85rem' }}>
                    {customer.qrToken}
                  </div>
                </div>

                <div style={{ width: '100%', maxWidth: '440px', textAlign: 'left', background: '#fcfaf8', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-xs)', padding: '0.9rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                  <div><strong>📱 Mobile:</strong> {customer.mobile}</div>
                  <div><strong>📍 Address:</strong> {customer.address || 'Standard Delivery Hub'}</div>
                  <div><strong>🆔 Aadhaar Number:</strong> {customer.adharNumber || 'Not provided'}</div>
                  <div><strong>📄 PAN Card Number:</strong> {customer.panNumber || 'Not provided'}</div>
                  <div><strong>🚚 Assigned Route Admin:</strong> <span style={{ color: 'var(--primary-red)', fontWeight: 700 }}>{customer.adminId?.name || 'Unassigned'}</span></div>
                  <div><strong>⚡ Status:</strong> <span className={customer.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>{customer.status}</span></div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '440px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => onOpenPrintPass?.(customer)}
                  >
                    <Printer size={14} />
                    <span>Print QR ID Card</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    style={{ flex: 1 }}
                    onClick={() => onOpenGiveMilk?.(customer)}
                  >
                    <Package size={14} />
                    <span>Give Milk</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL PRINTABLE MONTHLY BILL MODAL */}
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
    </>
  );
};
