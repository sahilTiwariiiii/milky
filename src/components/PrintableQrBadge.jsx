import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode, ShieldCheck, MapPin, Phone, CreditCard, Building2, User } from 'lucide-react';
import { api } from '../services/api';

export const PrintableQrBadge = ({ customer, onClose, orgConfig: initialOrgConfig }) => {
  const [orgConfig, setOrgConfig] = useState(initialOrgConfig || null);

  useEffect(() => {
    if (!initialOrgConfig) {
      api.getSystemConfig()
        .then((res) => {
          if (res.success && res.data?.config) {
            setOrgConfig(res.data.config);
          }
        })
        .catch(() => {});
    }
  }, [initialOrgConfig]);

  if (!customer) return null;

  const orgName = orgConfig?.orgName || 'Milky Dairy';
  const orgLogo = orgConfig?.orgLogo || '';
  const orgTagline = orgConfig?.tagline || 'Fresh & Pure Daily Milk';
  const orgPhone = orgConfig?.phone || '';

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
    <div className="modal-overlay printable-badge-modal">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <QrCode size={20} />
            <h3 style={{ margin: 0 }}>Customer Milk ID Pass</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Printable Card Area */}
          <div className="customer-id-card" id="printable-card">
            {/* Top Dairy Brand Header */}
            <div className="card-top-org-banner">
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="card-org-logo-img" />
              ) : (
                <div className="card-org-logo-fallback">
                  <Building2 size={16} />
                </div>
              )}
              <div className="card-org-text">
                <div className="card-org-name">{orgName}</div>
                <div className="card-org-tagline">{orgTagline}</div>
              </div>
            </div>

            <div className="card-divider-stripe" />

            <div className="card-pass-title">OFFICIAL CUSTOMER MILK PASS</div>

            {/* Customer Header with Photo & Name */}
            <div className="card-customer-profile-strip">
              {customer.image ? (
                <img src={customer.image} alt={customer.name} className="card-cust-avatar" />
              ) : (
                <div className="card-cust-avatar-placeholder">
                  <User size={28} />
                </div>
              )}
              <div className="card-cust-title-group">
                <div className="card-cust-name">{customer.name}</div>
                <div className="badge-qr-token">{customer.qrToken}</div>
              </div>
            </div>

            {/* High-Resolution QR Code */}
            <div className="card-qr-container">
              {customer.qrCode ? (
                <img
                  src={customer.qrCode}
                  alt={`QR code for ${customer.name}`}
                  className="badge-qr-img"
                />
              ) : (
                <div className="card-no-qr">No QR Data Available</div>
              )}
              <div className="card-scan-instruction">Scan to Record Milk Collection</div>
            </div>

            {/* Detailed Identification Specs */}
            <div className="card-details-grid">
              <div className="card-detail-item">
                <span className="card-detail-label">Mobile:</span>
                <span className="card-detail-val">{customer.mobile}</span>
              </div>

              {customer.adharNumber && (
                <div className="card-detail-item">
                  <span className="card-detail-label">Aadhaar:</span>
                  <span className="card-detail-val">XXXX-XXXX-{customer.adharNumber.slice(-4) || customer.adharNumber}</span>
                </div>
              )}

              {customer.panNumber && (
                <div className="card-detail-item">
                  <span className="card-detail-label">PAN:</span>
                  <span className="card-detail-val">{customer.panNumber}</span>
                </div>
              )}

              <div className="card-detail-item full-width">
                <span className="card-detail-label">Address:</span>
                <span className="card-detail-val">{customer.address || 'Standard Local Dairy Hub'}</span>
              </div>

              <div className="card-detail-item full-width">
                <span className="card-detail-label">Assigned Route:</span>
                <span className="card-detail-val font-semibold text-primary">
                  {customer.adminId?.name || 'Central Dairy Admin'}
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="card-footer-strip">
              <div>Authorized Customer ID • {orgName}</div>
              {orgPhone && <div>Helpline: {orgPhone}</div>}
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button type="button" className="btn btn-secondary" onClick={handleDownloadImage}>
            <Download size={15} />
            <span>Download QR Image</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Official Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
};
