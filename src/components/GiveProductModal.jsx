import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  X,
  Package,
  Clock,
  IndianRupee,
  CheckCircle2,
  Receipt,
  Sparkles
} from 'lucide-react';

// Helper to generate 1 to 125 quantity options with fractional sub-units
const getQuantityOptions = (unit = '') => {
  const u = (unit || '').toLowerCase();
  const isLitre = u.includes('litre') || u === 'l';
  const isKg = u.includes('kg') || u.includes('kilo');

  const options = [];

  if (isLitre) {
    options.push(
      { value: '0.25', label: '250 ml (0.25 Litre)' },
      { value: '0.5', label: '500 ml (½ Litre)' },
      { value: '0.75', label: '750 ml (¾ Litre)' }
    );
    for (let i = 1; i <= 125; i++) {
      options.push({ value: String(i), label: `${i} Litre` });
      if (i <= 10) {
        options.push({ value: `${i}.5`, label: `${i}.5 Litre (${i}L 500ml)` });
      }
    }
  } else if (isKg) {
    options.push(
      { value: '0.1', label: '100 gm (0.10 Kg)' },
      { value: '0.2', label: '200 gm (0.20 Kg)' },
      { value: '0.25', label: '250 gm (¼ Kg)' },
      { value: '0.5', label: '500 gm (½ Kg)' },
      { value: '0.75', label: '750 gm (¾ Kg)' }
    );
    for (let i = 1; i <= 125; i++) {
      options.push({ value: String(i), label: `${i} Kg` });
      if (i <= 10) {
        options.push({ value: `${i}.5`, label: `${i}.5 Kg (${i}kg 500gm)` });
      }
    }
  } else {
    for (let i = 1; i <= 125; i++) {
      options.push({ value: String(i), label: `${i} ${unit || 'Units'}` });
    }
  }

  return options;
};

// Quick-select preset chips
const getQuickChips = (unit = '') => {
  const u = (unit || '').toLowerCase();
  if (u.includes('litre') || u === 'l') {
    return [
      { val: '0.25', label: '250 ml' },
      { val: '0.5', label: '500 ml' },
      { val: '1', label: '1 L' },
      { val: '2', label: '2 L' },
      { val: '3', label: '3 L' },
      { val: '5', label: '5 L' },
      { val: '10', label: '10 L' },
      { val: '25', label: '25 L' },
      { val: '50', label: '50 L' },
      { val: '100', label: '100 L' },
      { val: '125', label: '125 L' }
    ];
  } else if (u.includes('kg') || u.includes('kilo')) {
    return [
      { val: '0.1', label: '100 gm' },
      { val: '0.25', label: '250 gm' },
      { val: '0.5', label: '500 gm' },
      { val: '1', label: '1 Kg' },
      { val: '2', label: '2 Kg' },
      { val: '5', label: '5 Kg' },
      { val: '10', label: '10 Kg' },
      { val: '25', label: '25 Kg' },
      { val: '50', label: '50 Kg' },
      { val: '100', label: '100 Kg' },
      { val: '125', label: '125 Kg' }
    ];
  }
  return [
    { val: '1', label: '1 Unit' },
    { val: '2', label: '2 Units' },
    { val: '5', label: '5 Units' },
    { val: '10', label: '10 Units' },
    { val: '25', label: '25 Units' },
    { val: '50', label: '50 Units' },
    { val: '100', label: '100 Units' },
    { val: '125', label: '125 Units' }
  ];
};

export const GiveProductModal = ({ customer, onClose, onTransactionCreated }) => {
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isCustomQty, setIsCustomQty] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, histRes] = await Promise.all([
          api.getProducts({ status: 'ACTIVE' }),
          api.getCustomerTransactions(customer._id || customer.id)
        ]);

        if (prodRes.success && prodRes.data?.products) {
          setProducts(prodRes.data.products);
          if (prodRes.data.products.length > 0) {
            setSelectedProductId(prodRes.data.products[0]._id);
          }
        }

        if (histRes.success && histRes.data?.transactions) {
          setHistory(histRes.data.transactions);
        }
      } catch (err) {
        showError(err.message || 'Failed to load distribution data');
      } finally {
        setLoadingHistory(false);
      }
    };

    if (customer) {
      fetchData();
    }
  }, [customer]);

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const unitPrice = selectedProduct?.price || 0;
  const numQty = parseFloat(quantity) || 0;
  const totalAmount = Math.round(numQty * unitPrice * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      showError('Please select a valid product and enter a positive quantity');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.recordTransaction({
        customerId: customer._id || customer.id,
        productId: selectedProductId,
        quantity: numQty,
        notes
      });

      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });

        showSuccess(`Recorded ${numQty} ${selectedProduct.unit} of ${selectedProduct.name} (₹${totalAmount})`);

        if (onTransactionCreated) {
          onTransactionCreated(res.data.transaction);
        }

        const updatedHist = await api.getCustomerTransactions(customer._id || customer.id);
        if (updatedHist.success) {
          setHistory(updatedHist.data.transactions);
        }

        setNotes('');
        setQuantity('1');
      }
    } catch (err) {
      showError(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        {/* Header */}
        <div className="modal-header">
          <h3>
            <Receipt size={18} />
            <span>Record Milk & Product Distribution</span>
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Customer Summary Strip */}
          <div style={{
            background: '#fdfbf7',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Customer Name</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-heading)' }}>{customer.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>QR Token</div>
              <div className="badge-qr-token">{customer.qrToken}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Phone</div>
              <div style={{ fontWeight: 600 }}>{customer.mobile}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Route Admin</div>
              <div style={{ fontWeight: 700, color: 'var(--primary-red)' }}>{customer.adminId?.name || 'Assigned Admin'}</div>
            </div>
          </div>

          {/* Distribution Entry Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Select Dairy Product
                </label>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.price}/{p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Quantity ({selectedProduct?.unit || 'L / Kg'}) *
                  </label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setIsCustomQty(!isCustomQty)}
                  >
                    {isCustomQty ? 'Switch to Dropdown (1-125)' : 'Custom Decimal Input'}
                  </button>
                </div>

                {!isCustomQty ? (
                  <select
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  >
                    <optgroup label={`Common Sub-Units (${selectedProduct?.unit || 'Unit'})`}>
                      {getQuantityOptions(selectedProduct?.unit).filter((o) => parseFloat(o.value) < 1).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label={`1 to 125 ${selectedProduct?.unit || 'Units'}`}>
                      {getQuantityOptions(selectedProduct?.unit).filter((o) => parseFloat(o.value) >= 1).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </optgroup>
                  </select>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="125"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={`e.g. 1.75 ${selectedProduct?.unit || 'L'}`}
                    required
                  />
                )}

                {/* Quick-Select Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {getQuickChips(selectedProduct?.unit).map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      style={{
                        background: quantity === chip.val ? 'var(--primary-red)' : '#f3f4f6',
                        color: quantity === chip.val ? '#ffffff' : 'var(--text-main)',
                        border: `1px solid ${quantity === chip.val ? 'var(--primary-red)' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setQuantity(chip.val);
                        setIsCustomQty(false);
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Financial Calculation Box */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-xs)',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Billing Rate Calculation
                </div>
                <div style={{ fontSize: '0.92rem', color: '#14532d', fontWeight: 700, marginTop: '0.2rem' }}>
                  {numQty < 1 && (selectedProduct?.unit || '').toLowerCase().includes('litre') ? (
                    <span>{numQty * 1000} ml ({numQty} Litre)</span>
                  ) : numQty < 1 && (selectedProduct?.unit || '').toLowerCase().includes('kg') ? (
                    <span>{numQty * 1000} gm ({numQty} Kg)</span>
                  ) : (
                    <span>{numQty} {selectedProduct?.unit || 'Units'}</span>
                  )}
                  <span style={{ color: '#16a34a', margin: '0 0.4rem' }}>&times;</span>
                  <span>₹{unitPrice} per {selectedProduct?.unit || 'Unit'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Billable
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803d', lineHeight: 1.1 }}>
                  ₹{totalAmount}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning delivery, UPI payment received"
              />
            </div>

            <button
              type="submit"
              className="btn btn-success"
              disabled={submitting || numQty <= 0}
              style={{ padding: '0.75rem', fontSize: '0.9rem' }}
            >
              {submitting ? 'Recording...' : 'Submit & Save to Billing Ledger'}
              <CheckCircle2 size={16} />
            </button>
          </form>

          {/* Customer History Section */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)' }}>
              <Clock size={16} style={{ color: 'var(--primary-red)' }} />
              <span>Previous Deliveries for {customer.name} ({history.length})</span>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', background: '#fdfbf7', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
                No prior delivery records for this customer yet.
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price at Sale</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => (
                      <tr key={tx._id}>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: 700 }}>{tx.productName}</td>
                        <td>{tx.quantity} {tx.unit}</td>
                        <td style={{ color: 'var(--text-muted)' }}>₹{tx.priceAtTransaction}/{tx.unit}</td>
                        <td style={{ fontWeight: 800, color: '#15803d' }}>₹{tx.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
