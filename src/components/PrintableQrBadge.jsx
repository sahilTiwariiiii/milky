import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode, ShieldCheck, MapPin, Phone, Building2, UserCheck, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { formatDateDisplay } from '../utils/dateUtils';

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

  const orgName = orgConfig?.orgName || 'MILKY DAIRY DISTRIBUTION';
  const orgTagline = orgConfig?.tagline || 'Fresh Farm Milk & Daily Dairy Supply Network';
  const orgPhone = orgConfig?.phone || '+91 98765 43210';
  const orgAddress = orgConfig?.address || 'Central Dairy Station';

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
      <div className="modal-content customer-pass-modal-container">
        {/* MODAL HEADER (HIDDEN ON PRINT) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <QrCode size={18} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Customer Digital Milk Pass</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} title="Close Pass">
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY WITH THE ID PASS */}
        <div className="modal-body pass-modal-body">
          {/* THE OFFICIAL PRINTABLE PHYSICAL CARD */}
          <div className="official-pass-card" id="printable-card">
            {/* 1. TOP ORG HEADER BANNER */}
            <div className="pass-org-banner">
              <div className="pass-org-left">
                <img src={orgConfig?.orgLogo || '/applogo.png'} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div className="pass-org-name">{orgName}</div>
                  <div className="pass-org-sub">{orgTagline}</div>
                </div>
              </div>
              <div className="pass-org-pill">
                OFFICIAL PASS
              </div>
            </div>

            {/* 2. SECURITY STRIPE */}
            <div className="pass-security-ribbon">
              <span>AUTHORIZED DAIRY RECIPIENT CARD</span>
              <span>•</span>
              <span>VERIFIED ACCESS</span>
            </div>

            {/* 3. CUSTOMER IDENTITY BANNER (NO PHOTO - SLEEK NAME & BADGE) */}
            <div className="pass-identity-section">
              <div className="pass-identity-left">
                <div className="pass-customer-name">{customer.name}</div>
                <div className="pass-token-holder">
                  <span className="pass-token-label">CUSTOMER ID:</span>
                  <strong className="pass-token-val">{customer.qrToken}</strong>
                </div>
              </div>
              <div className="pass-status-chip">
                <ShieldCheck size={14} />
                <span>{customer.status || 'ACTIVE'}</span>
              </div>
            </div>

            {/* 4. CENTRAL HIGH-RESOLUTION QR CODE DISPLAY */}
            <div className="pass-qr-showcase">
              <div className="pass-qr-frame">
                {customer.qrCode ? (
                  <img
                    src={customer.qrCode}
                    alt={`QR code for ${customer.name}`}
                    className="pass-qr-image"
                  />
                ) : (
                  <div className="pass-no-qr">QR Code Not Available</div>
                )}
              </div>
              <div className="pass-scan-caption">
                Scan QR at delivery time to record daily milk distribution
              </div>
            </div>

            {/* 5. STRUCTURED RECIPIENT SPECIFICATIONS */}
            <div className="pass-specs-grid">
              <div className="pass-spec-item">
                <span className="pass-spec-label"><Phone size={11} /> Registered Mobile:</span>
                <span className="pass-spec-val">{customer.mobile}</span>
              </div>

              <div className="pass-spec-item">
                <span className="pass-spec-label"><MapPin size={11} /> Delivery Route Point:</span>
                <span className="pass-spec-val">{customer.address || 'Standard Delivery Route'}</span>
              </div>

              <div className="pass-spec-item">
                <span className="pass-spec-label"><UserCheck size={11} /> Assigned Route Incharge:</span>
                <span className="pass-spec-val pass-highlight">
                  {customer.adminId?.name || 'Authorized Hub Admin'}
                </span>
              </div>

              {customer.adharNumber && (
                <div className="pass-spec-item">
                  <span className="pass-spec-label">Aadhaar (Last 4):</span>
                  <span className="pass-spec-val">•••• •••• {customer.adharNumber.slice(-4)}</span>
                </div>
              )}

              {customer.panNumber && (
                <div className="pass-spec-item">
                  <span className="pass-spec-label">PAN Number:</span>
                  <span className="pass-spec-val">{customer.panNumber}</span>
                </div>
              )}
            </div>

            {/* 6. SECURITY & AUDIT FOOTER */}
            <div className="pass-footer-banner">
              <div className="pass-seal-block">
                <CheckCircle2 size={13} color="#047857" />
                <span>MILKY TAMPER-PROOF VERIFIED LEDGER</span>
              </div>
              <div className="pass-helpline-block">
                Helpline: {orgPhone}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER CONTROLS (HIDDEN ON PRINT) */}
        <div className="modal-footer no-print">
          <button type="button" className="btn btn-outline" onClick={handleDownloadImage}>
            <Download size={15} />
            <span>Download QR Code</span>
          </button>
          <button type="button" className="btn btn-success" onClick={handlePrint} style={{ fontWeight: 700 }}>
            <Printer size={15} />
            <span>Print Pass / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
