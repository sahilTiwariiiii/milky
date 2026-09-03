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

export const GiveProductModal = ({ customer, onClose, onTransactionCreated }) => {
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
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
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Quantity ({selectedProduct?.unit || 'unit'})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 2"
                  required
                />
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
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                  Billing Rate Calculation
                </div>
                <div style={{ fontSize: '0.88rem', color: '#14532d', fontWeight: 600, marginTop: '0.15rem' }}>
                  {numQty} {selectedProduct?.unit || 'L'} &times; ₹{unitPrice}/{selectedProduct?.unit || 'L'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Billable
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>
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
