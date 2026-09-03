import React from 'react';
import { X, Printer, Download, QrCode } from 'lucide-react';

export const PrintableQrBadge = ({ customer, onClose }) => {
  if (!customer) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    if (!customer.qrCode) return;
    const link = document.createElement('a');
    link.href = customer.qrCode;
    link.download = `QR_${customer.name.replace(/\s+/g, '_')}_${customer.qrToken}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <QrCode size={20} className="text-primary" />
            <h3 style={{ margin: 0 }}>Customer QR ID Card</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Printable Card Area */}
          <div className="customer-id-card" id="printable-card">
            <div className="badge-header">DAIRY QR PASS</div>
            <div className="badge-sub">Customer Identification Card</div>

            {customer.qrCode ? (
              <img
                src={customer.qrCode}
                alt={`QR code for ${customer.name}`}
                className="badge-qr-img"
              />
            ) : (
              <div style={{ width: '180px', height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No QR Data
              </div>
            )}

            <div className="badge-token-text">{customer.qrToken}</div>
            <div className="badge-cust-name">{customer.name}</div>
            <div className="badge-cust-phone">📱 {customer.mobile}</div>
            {customer.address && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                📍 {customer.address}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer no-print">
          <button type="button" className="btn btn-secondary" onClick={handleDownloadImage}>
            <Download size={16} />
            <span>Download PNG</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
