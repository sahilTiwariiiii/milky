import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiveProductModal } from './GiveProductModal';
import {
  QrCode,
  Camera,
  Keyboard,
  Sparkles,
  Upload,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export const QrScanView = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [activeTab, setActiveTab] = useState('demo'); // Default to demo so user can test immediately with real QRs!
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Scanned customer result
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [showGiveProductModal, setShowGiveProductModal] = useState(false);

  // Customer list with generated QRs
  const [customerList, setCustomerList] = useState([]);
  const html5QrCodeRef = useRef(null);

  const fetchCustomersWithQr = async () => {
    try {
      const res = await api.getCustomers({ limit: 50 });
      if (res.success && res.data?.customers) {
        setCustomerList(res.data.customers);
      }
    } catch (err) {
      console.error('Failed to load customers for QR scanner', err);
    }
  };

  useEffect(() => {
    fetchCustomersWithQr();
  }, [user]);

  // Camera Scanner
  useEffect(() => {
    if (activeTab === 'camera') {
      const startCamera = async () => {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader-viewport');
          html5QrCodeRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              handleProcessQrToken(decodedText);
              stopCamera();
            },
            () => {}
          );
          setScanning(true);
        } catch (err) {
          showWarning('Camera not available or permission denied. Switched to visual QR test mode.');
          setActiveTab('demo');
        }
      };

      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {}
      setScanning(false);
    }
  };

  // Image Upload QR scan
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-hidden');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleProcessQrToken(decodedText);
    } catch (err) {
      showError('Could not decode QR code from the uploaded image. Please ensure the QR is clear.');
    }
  };

  const handleProcessQrToken = async (tokenToProcess) => {
    const token = tokenToProcess || manualToken;
    if (!token || !token.trim()) {
      showError('Please enter or scan a valid QR token');
      return;
    }

    setLoading(true);
    try {
      const res = await api.getCustomerByQr(token.trim());
      if (res.success && res.data?.customer) {
        showSuccess(`QR Verified! Customer: ${res.data.customer.name}`);
        setScannedCustomer(res.data.customer);
        setShowGiveProductModal(true);
      }
    } catch (err) {
      if (err.status === 403) {
        showError('ACCESS FORBIDDEN (403): This customer belongs to another Admin! Admin isolation strictly enforced.');
      } else if (err.status === 404) {
        showError(`Customer Not Found (404) for token: "${token}"`);
      } else {
        showError(err.message || 'QR Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleProcessQrToken(manualToken);
  };

  return (
    <div>
      {/* Hidden container for file scan */}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>

      {/* ENTERPRISE SCANNER PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <QrCode size={16} />
            <span>Customer QR Verification & Scanner Terminal</span>
          </h3>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'demo' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'demo' ? { background: '#fff', color: 'var(--primary-red)' } : { background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              onClick={() => setActiveTab('demo')}
            >
              <Sparkles size={12} />
              <span>Test Customer QRs</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'camera' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'camera' ? { background: '#fff', color: 'var(--primary-red)' } : { background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              onClick={() => setActiveTab('camera')}
            >
              <Camera size={12} />
              <span>Camera Scan</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'manual' ? { background: '#fff', color: 'var(--primary-red)' } : { background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              onClick={() => setActiveTab('manual')}
            >
              <Keyboard size={12} />
              <span>Token Entry</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* TAB 1: VISUAL TEST GALLERY WITH REAL GENERATED QRS */}
          {activeTab === 'demo' && (
            <div>
              <div style={{
                background: 'var(--primary-red-soft)',
                border: '1px solid var(--primary-red-border)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.65rem 0.95rem',
                fontSize: '0.78rem',
                color: 'var(--primary-red-dark)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <strong>QR Scan Test Suite:</strong> Click <strong>"Scan This QR"</strong> on any customer below. The scanner will verify the QR token, look up their profile, check Admin authorization (403 for unauthorized admins), and open the Give Milk distribution form!
                </div>
                <div>
                  <label className="btn btn-xs btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
                    <Upload size={12} />
                    <span>Upload QR Image File</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {customerList.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customers found. Create a customer to generate QR codes.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '0.85rem'
                }}>
                  {customerList.map((c) => {
                    const isAssignedToMe = isSuperAdmin || (c.adminId?._id === user?.id || c.adminId === user?.id);
                    return (
                      <div
                        key={c._id}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${isAssignedToMe ? 'var(--border-medium)' : '#fca5a5'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          boxShadow: 'var(--shadow-xs)',
                          position: 'relative',
                          borderTop: isAssignedToMe ? '3px solid var(--primary-red)' : '3px solid #dc2626'
                        }}
                      >
                        {/* Status tag */}
                        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                          <span className={isAssignedToMe ? 'badge-status-green' : 'badge-status-red'}>
                            {isAssignedToMe ? 'Your Route' : '403 Forbidden'}
                          </span>
                        </div>

                        {/* Real Generated QR Image */}
                        <div style={{
                          background: '#fff',
                          border: '1px solid var(--border-medium)',
                          padding: '4px',
                          borderRadius: 'var(--radius-xs)',
                          marginBottom: '0.5rem'
                        }}>
                          {c.qrCode ? (
                            <img
                              src={c.qrCode}
                              alt={`QR for ${c.name}`}
                              style={{ width: '100px', height: '100px', display: 'block' }}
                            />
                          ) : (
                            <div style={{ width: '100px', height: '100px', background: '#f5ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <QrCode size={24} />
                            </div>
                          )}
                        </div>

                        <div className="badge-qr-token" style={{ marginBottom: '0.35rem' }}>
                          {c.qrToken}
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>
                          {c.name}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                          Phone: {c.mobile} • Route: <strong>{c.adminId?.name || 'Assigned'}</strong>
                        </div>

                        {/* Test Scan Button */}
                        <button
                          type="button"
                          className={isAssignedToMe ? 'btn btn-xs btn-success' : 'btn btn-xs btn-danger-outline'}
                          style={{ width: '100%' }}
                          onClick={() => handleProcessQrToken(c.qrToken)}
                          disabled={loading}
                        >
                          <QrCode size={12} />
                          <span>{isAssignedToMe ? 'Scan & Give Milk' : 'Test 403 Forbidden Scan'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div id="qr-reader-viewport" className="scanner-viewport"></div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Point device camera at any printed or displayed Customer QR Pass.
              </p>
            </div>
          )}

          {/* TAB 3: MANUAL TOKEN LOOKUP */}
          {activeTab === 'manual' && (
            <div style={{ maxWidth: '380px', margin: '1rem auto', textAlign: 'center' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--primary-red-soft)',
                color: 'var(--primary-red)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem'
              }}>
                <QrCode size={24} />
              </div>

              <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-heading)' }}>
                Manual QR Token Verification
              </h4>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Enter the unique token from the customer pass or barcode scanner.
              </p>

              <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '0.65rem'
                  }}
                  placeholder="CUST_XXXXXXXX"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !manualToken.trim()}
                  style={{ padding: '0.65rem' }}
                >
                  {loading ? 'Verifying Pass...' : 'Verify Token & Open Profile'}
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Give Product Modal */}
      {showGiveProductModal && scannedCustomer && (
        <GiveProductModal
          customer={scannedCustomer}
          onClose={() => {
            setShowGiveProductModal(false);
            setScannedCustomer(null);
          }}
          onTransactionCreated={() => {
            fetchCustomersWithQr();
          }}
        />
      )}
    </div>
  );
};
