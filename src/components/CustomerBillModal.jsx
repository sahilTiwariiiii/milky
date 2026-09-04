import React, { useRef } from 'react';
import {
  Printer,
  X,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Package,
  CheckCircle2
} from 'lucide-react';
import { formatDateDisplay, formatCurrency } from '../utils/dateUtils';

// Helper to convert number to words for Indian Rupees
const numberToWords = (num) => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n === 0) return 'Zero';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(Math.abs(num || 0));
  if (integerPart === 0) return 'Zero Rupees Only';
  return `${inWords(integerPart)} Rupees Only`;
};

export const CustomerBillModal = ({
  customer,
  transactions = [],
  summary = {},
  startDate,
  endDate,
  selectedMonthLabel,
  onClose
}) => {
  const printRef = useRef(null);

  if (!customer) return null;

  // Group transactions by product for product-level summary
  const productSummary = {};
  transactions.forEach((tx) => {
    const prodName = tx.productName || tx.productId?.name || 'Dairy Product';
    const unit = tx.unit || tx.productId?.unit || 'Units';
    const rate = Number(tx.priceAtTransaction) || Number(tx.productId?.price) || 0;
    const qty = Number(tx.quantity) || 0;
    const amt = Number(tx.totalAmount) || 0;

    if (!productSummary[prodName]) {
      productSummary[prodName] = {
        name: prodName,
        category: tx.productId?.category || 'Milk',
        unit,
        rate,
        totalQuantity: 0,
        totalAmount: 0,
        deliveryCount: 0
      };
    }
    productSummary[prodName].totalQuantity += qty;
    productSummary[prodName].totalAmount += amt;
    productSummary[prodName].deliveryCount += 1;
  });

  const productSummaryList = Object.values(productSummary);

  const grandTotal = transactions.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const totalVolume = transactions.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const billNumber = `MILK-BILL-${(customer.qrToken || 'CUST').slice(-8)}-${startDate?.replace(/-/g, '').slice(0, 6) || '2026'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay customer-bill-overlay">
      <div className="modal-content customer-bill-modal-content">
        {/* TOP CONTROLS (HIDDEN ON PRINT) */}
        <div className="modal-header no-print" style={{ background: '#1e293b', color: '#fff', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={18} className="text-amber-400" />
            <h3 style={{ color: '#fff', fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>
              Monthly Statement & Invoice: {customer.name}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <Printer size={15} />
              <span>Print Bill / PDF</span>
            </button>
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              style={{ color: '#cbd5e1' }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE BILL WRAPPER */}
        <div className="customer-bill-paper" ref={printRef}>
          {/* BILL TOP BANNER */}
          <div className="bill-header">
            <div className="bill-brand">
              <div className="bill-brand-badge">MILKY</div>
              <div>
                <h2 className="bill-dairy-name">MILKY DAIRY DISTRIBUTION ERP</h2>
                <p className="bill-dairy-sub">Fresh Farm Milk & Daily Dairy Supply Network</p>
                <p className="bill-dairy-contact">Route Hub: Central Dairy Station | Helpline: +91 98765 43210</p>
              </div>
            </div>

            <div className="bill-meta-box">
              <div className="bill-badge-title">TAX INVOICE / MONTHLY BILL</div>
              <div className="bill-meta-row">
                <span>Bill No:</span>
                <strong>{billNumber}</strong>
              </div>
              <div className="bill-meta-row">
                <span>Billing Period:</span>
                <strong>{selectedMonthLabel || `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`}</strong>
              </div>
              <div className="bill-meta-row">
                <span>Date of Issue:</span>
                <span>{formatDateDisplay(new Date())}</span>
              </div>
              <div className="bill-meta-row">
                <span>Status:</span>
                <span className="bill-status-pill">VERIFIED LEDGER</span>
              </div>
            </div>
          </div>

          <div className="bill-divider-solid" />

          {/* CUSTOMER & ROUTE ADMIN INFO CARDS */}
          <div className="bill-parties-grid">
            <div className="bill-party-card">
              <div className="bill-party-tag">CUSTOMER DETAILS (BILL TO)</div>
              <div className="bill-customer-name">{customer.name}</div>
              <div className="bill-party-line">
                <Phone size={12} />
                <span><strong>Phone:</strong> {customer.mobile}</span>
              </div>
              <div className="bill-party-line">
                <MapPin size={12} />
                <span><strong>Address:</strong> {customer.address || 'Doorstep Distribution Route'}</span>
              </div>
              {customer.adharNumber && (
                <div className="bill-party-line">
                  <span><strong>Aadhaar:</strong> •••• •••• {customer.adharNumber.slice(-4)}</span>
                </div>
              )}
              {customer.panNumber && (
                <div className="bill-party-line">
                  <span><strong>PAN:</strong> {customer.panNumber}</span>
                </div>
              )}
            </div>

            <div className="bill-party-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="bill-party-tag">ROUTE & DISTRIBUTION ASSIGNMENT</div>
                <div className="bill-party-line" style={{ marginTop: '0.35rem' }}>
                  <span><strong>Assigned Admin:</strong> {customer.adminId?.name || 'Authorized Dairy Admin'}</span>
                </div>
                <div className="bill-party-line">
                  <span><strong>Admin Contact:</strong> {customer.adminId?.mobile || customer.adminId?.email || 'Central Dispatch'}</span>
                </div>
                <div className="bill-party-line">
                  <span><strong>Customer Pass ID:</strong> <code className="bill-token-pill">{customer.qrToken}</code></span>
                </div>
                <div className="bill-party-line">
                  <span><strong>Total Deliveries:</strong> {transactions.length} Days</span>
                </div>
              </div>

              {customer.qrCode && (
                <div className="bill-qr-container">
                  <img src={customer.qrCode} alt="Customer QR" style={{ width: '70px', height: '70px' }} />
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>CUST QR</span>
                </div>
              )}
            </div>
          </div>

          {/* BILLING KPI HIGHLIGHTS */}
          <div className="bill-kpi-row">
            <div className="bill-kpi-item">
              <span className="bill-kpi-label">Total Volume Supplied</span>
              <span className="bill-kpi-val">{totalVolume.toFixed(2)} Units/Litres</span>
            </div>
            <div className="bill-kpi-item">
              <span className="bill-kpi-label">Active Delivery Days</span>
              <span className="bill-kpi-val">{transactions.length} Entries</span>
            </div>
            <div className="bill-kpi-item highlight">
              <span className="bill-kpi-label">Net Payable Amount</span>
              <span className="bill-kpi-val">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* 1. ITEMIZED DAILY ORDERS LOG - PROMINENT DAY-BY-DAY BREAKDOWN */}
          <div className="bill-section" style={{ marginTop: '0.85rem' }}>
            <div className="bill-section-title">
              <Calendar size={13} />
              <span>Day-by-Day Delivery Log: All Entries for {selectedMonthLabel || 'Current Billing Period'} ({transactions.length} Deliveries)</span>
            </div>

            {transactions.length === 0 ? (
              <div className="bill-empty-state">
                No milk/product deliveries recorded for this selected month/period ({formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}).
              </div>
            ) : (
              <div className="table-responsive">
                <table className="bill-table bill-table-striped">
                  <thead>
                    <tr>
                      <th style={{ width: '35px' }}>#</th>
                      <th>Day & Date</th>
                      <th>Time / Shift</th>
                      <th>Product Delivered</th>
                      <th style={{ textAlign: 'right' }}>Rate (₹/Unit)</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Daily Total</th>
                      <th>Delivered By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => {
                      const txDate = new Date(tx.createdAt);
                      const dayName = txDate.toLocaleDateString('en-IN', { weekday: 'short' });
                      const timeStr = txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const hours = txDate.getHours();
                      const shiftLabel = hours < 12 ? 'Morning' : 'Evening';

                      return (
                        <tr key={tx._id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#0f172a' }}>{formatDateDisplay(tx.createdAt)}</strong>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b' }}>
                              {dayName}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span>{timeStr}</span>
                            <span style={{ display: 'block', fontSize: '0.66rem', color: '#16a34a', fontWeight: 600 }}>
                              {shiftLabel}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            {tx.productName || tx.productId?.name || 'Milk'}
                            {tx.notes && (
                              <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 'normal' }}>
                                Note: {tx.notes}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(tx.priceAtTransaction || tx.productId?.price || 0)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {tx.quantity} {tx.unit || tx.productId?.unit || 'L'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            {formatCurrency(tx.totalAmount)}
                          </td>
                          <td style={{ fontSize: '0.72rem', color: '#475569' }}>
                            {tx.adminId?.name || 'Central Dairy Route'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. PRODUCT BREAKDOWN SUMMARY TABLE */}
          {productSummaryList.length > 0 && (
            <div className="bill-section" style={{ marginTop: '1.25rem' }}>
              <div className="bill-section-title">
                <Package size={13} />
                <span>Monthly Product-wise Total Consumption</span>
              </div>
              <div className="table-responsive">
                <table className="bill-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Product Category</th>
                      <th style={{ textAlign: 'right' }}>Standard Rate</th>
                      <th style={{ textAlign: 'right' }}>Total Quantity Taken</th>
                      <th style={{ textAlign: 'right' }}>Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSummaryList.map((item, idx) => (
                      <tr key={`sum-${idx}`}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{item.name}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)} / {item.unit}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {item.totalQuantity} {item.unit} ({item.deliveryCount} days)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TOTALS & SUMMARY FOOTER */}
          <div className="bill-summary-container">
            <div className="bill-in-words-box">
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>
                Total In Words:
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem', fontStyle: 'italic' }}>
                {numberToWords(grandTotal)}
              </div>
              <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>
                <strong>Note:</strong> Please clear the monthly bill before the 7th of every month. For any quantity adjustments or queries, please contact your route representative.
              </div>
            </div>

            <div className="bill-grand-total-card">
              <div className="bill-total-row">
                <span>Total Items/Days:</span>
                <strong>{transactions.length}</strong>
              </div>
              <div className="bill-total-row">
                <span>Gross Volume:</span>
                <strong>{totalVolume.toFixed(2)} Units</strong>
              </div>
              <div className="bill-total-row">
                <span>Subtotal:</span>
                <strong>{formatCurrency(grandTotal)}</strong>
              </div>
              <div className="bill-total-row">
                <span>Taxes / Cess:</span>
                <strong>₹0.00</strong>
              </div>
              <div className="bill-divider-solid" style={{ margin: '0.4rem 0' }} />
              <div className="bill-total-row grand">
                <span>Net Payable:</span>
                <span className="bill-grand-val">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* SIGNATURES BLOCK */}
          <div className="bill-signature-grid">
            <div className="bill-sign-col">
              <div className="bill-sign-line" />
              <div className="bill-sign-label">Customer Signature</div>
            </div>
            <div className="bill-sign-col">
              <div className="bill-sign-seal">
                <CheckCircle2 size={16} color="#15803d" />
                <span>OFFICIAL VERIFIED LEDGER</span>
              </div>
              <div className="bill-sign-line" />
              <div className="bill-sign-label">Authorized Dairy Incharge</div>
            </div>
          </div>

          {/* PRINT-ONLY FOOTER */}
          <div className="bill-print-footer">
            Printed on {new Date().toLocaleString()} | Milky Dairy Enterprise ERP | Automated Tamper-Proof Audit
          </div>
        </div>

        {/* BOTTOM ACTION BAR (HIDDEN ON PRINT) */}
        <div className="modal-footer no-print" style={{ background: '#f8fafc', padding: '0.75rem 1.25rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Printer size={15} />
            <span>Print Monthly Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
