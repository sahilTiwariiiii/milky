import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
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
  AlertTriangle,
  AlertCircle,
  Receipt,
  Clock,
  Printer,
  X,
  Phone,
  MapPin,
  RefreshCw,
  IndianRupee,
  StopCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

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

export const QrScanView = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'camera' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Scanned customer result & inline transaction form
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [customerTodayStatus, setCustomerTodayStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isCustomQty, setIsCustomQty] = useState(false);
  const [notes, setNotes] = useState('');
  const [submittingTx, setSubmittingTx] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastRecordedTx, setLastRecordedTx] = useState(null);

  // Customer list with generated QRs for visual testing
  const [customerList, setCustomerList] = useState([]);
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastScannedTokenRef = useRef('');

  const fetchInitialData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers({ limit: 50 }),
        api.getProducts({ status: 'ACTIVE', limit: 100 })
      ]);

      if (custRes.success && custRes.data?.customers) {
        setCustomerList(custRes.data.customers);
      }
      if (prodRes.success && prodRes.data?.products) {
        setProducts(prodRes.data.products);
        if (prodRes.data.products.length > 0) {
          setSelectedProductId(prodRes.data.products[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial scanner data', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user, activeTab]);

  const handleSelectCustomerCard = (customer) => {
    const isAssigned = isSuperAdmin || (customer.adminId?._id === user?.id || customer.adminId === user?.id);
    if (!isAssigned) {
      handleProcessQrToken(customer.qrToken);
      return;
    }

    setScannedCustomer(customer);
    setManualToken(customer.qrToken || '');
    showSuccess(`Selected Customer: ${customer.name} (${customer.qrToken})`);
    fetchCustomerHistory(customer._id);
  };

  // Camera Hardware State
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [startingCamera, setStartingCamera] = useState(false);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stop warning:', e);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async (overrideCameraId) => {
    setStartingCamera(true);
    setCameraError('');

    await stopCamera();

    // Allow DOM to settle
    await new Promise((r) => setTimeout(r, 150));
    const viewport = document.getElementById('qr-reader-viewport');
    if (!viewport) {
      setCameraError('Camera viewport is not ready. Please try again.');
      setStartingCamera(false);
      return;
    }

    try {
      // 1. Enumerate available video inputs if not yet loaded
      let devList = cameras;
      if (!devList || devList.length === 0) {
        try {
          devList = await Html5Qrcode.getCameras();
          if (devList && devList.length > 0) {
            setCameras(devList);
          }
        } catch (e) {
          console.warn('Could not enumerate cameras upfront:', e);
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      html5QrCodeRef.current = html5QrCode;

      const qrConfig = {
        fps: 10,
        qrbox: (w, h) => {
          const side = Math.floor(Math.min(w, h) * 0.75);
          return {
            width: Math.max(160, Math.min(260, side)),
            height: Math.max(160, Math.min(260, side))
          };
        }
      };

      const onScanSuccess = async (decodedText) => {
        if (isProcessingRef.current) return;
        const token = (decodedText || '').trim();
        if (!token || token === lastScannedTokenRef.current) return;

        isProcessingRef.current = true;
        lastScannedTokenRef.current = token;

        // Feedback beep sound
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.1;
          osc.start();
          setTimeout(() => {
            osc.stop();
            ctx.close();
          }, 150);
        } catch (e) {}

        await stopCamera();
        handleProcessQrToken(token);
      };

      const targetId = overrideCameraId || selectedCameraId;
      if (targetId) {
        await html5QrCode.start(targetId, qrConfig, onScanSuccess, () => {});
      } else if (devList && devList.length > 0) {
        // Prefer rear/environment camera on phones, else first camera
        const rearCam = devList.find((c) =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment')
        );
        const chosenId = rearCam ? rearCam.id : devList[0].id;
        setSelectedCameraId(chosenId);
        await html5QrCode.start(chosenId, qrConfig, onScanSuccess, () => {});
      } else {
        // No explicit camera id - attempt environment then fallback to user/webcam
        try {
          await html5QrCode.start({ facingMode: 'environment' }, qrConfig, onScanSuccess, () => {});
        } catch (envErr) {
          console.warn('Environment facingMode not supported on device, falling back to user facingMode:', envErr);
          await html5QrCode.start({ facingMode: 'user' }, qrConfig, onScanSuccess, () => {});
        }
      }

      setScanning(true);
      setCameraError('');
    } catch (err) {
      console.error('Camera initialization error:', err);
      const msg = err?.message || String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        setCameraError('Camera permission was denied. Please allow camera access in your browser address bar (lock icon) and click Retry.');
      } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found')) {
        setCameraError('No webcam or camera was detected on this system. You can upload a QR image file or use the test terminal.');
      } else if (msg.includes('NotReadableError') || msg.includes('Could not start video source')) {
        setCameraError('Camera is currently locked by another application. Please close any running video apps and click Retry.');
      } else {
        setCameraError(`Camera initialization failed (${msg}). Click Retry or upload a QR image.`);
      }
      setScanning(false);
    } finally {
      setStartingCamera(false);
    }
  };

  // Automatically start camera when switching to 'camera' tab
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

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

  // Fetch Customer details & transactions upon scanning
  const handleProcessQrToken = async (tokenToProcess) => {
    const token = tokenToProcess || manualToken;
    if (!token || !token.trim()) {
      showError('Please enter or scan a valid QR token');
      isProcessingRef.current = false;
      return;
    }

    setLoading(true);
    setLastRecordedTx(null);
    try {
      const res = await api.getCustomerByQr(token.trim());
      if (res.success && res.data?.customer) {
        const cust = res.data.customer;
        setScannedCustomer(cust);
        showSuccess(`Verified Customer: ${cust.name}`);

        // Fetch customer's delivery history & today's status
        fetchCustomerHistory(cust._id);
      }
    } catch (err) {
      if (err.status === 403) {
        showError('ACCESS FORBIDDEN (403): This customer is assigned to another Admin! Admin isolation strictly enforced.');
      } else if (err.status === 404) {
        showError(`Customer Not Found (404) for token: "${token}"`);
      } else {
        showError(err.message || 'QR Verification failed');
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  const fetchCustomerHistory = async (customerId) => {
    setLoadingHistory(true);
    try {
      const res = await api.getCustomerTransactions(customerId, { limit: 10 });
      if (res.success && res.data?.transactions) {
        setHistory(res.data.transactions);

        // Check if customer had delivery today
        const now = new Date();
        const todayTxs = res.data.transactions.filter((tx) => {
          const d = new Date(tx.createdAt);
          return d.toDateString() === now.toDateString();
        });

        if (todayTxs.length > 0) {
          const totalQty = todayTxs.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
          const totalAmt = todayTxs.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
          setCustomerTodayStatus({
            delivered: true,
            totalQty,
            totalAmt,
            txCount: todayTxs.length,
            lastTime: todayTxs[0].createdAt
          });
        } else {
          setCustomerTodayStatus({ delivered: false });
        }
      }
    } catch (err) {
      console.error('Failed to load customer history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleProcessQrToken(manualToken);
  };

  // Record Milk Delivery for the scanned customer
  const handleRecordDelivery = async (e) => {
    e.preventDefault();
    if (!scannedCustomer || !selectedProductId) {
      showError('Please select a product and enter a valid quantity');
      return;
    }

    const numQty = parseFloat(quantity) || 0;
    if (numQty <= 0) {
      showError('Quantity must be greater than 0');
      return;
    }

    const prod = products.find((p) => p._id === selectedProductId);
    const calculatedAmount = Math.round(numQty * (prod?.price || 0) * 100) / 100;

    setSubmittingTx(true);
    try {
      const res = await api.recordTransaction({
        customerId: scannedCustomer._id,
        productId: selectedProductId,
        quantity: numQty,
        notes: notes.trim()
      });

      if (res.success && res.data?.transaction) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });

        showSuccess(`Recorded ${numQty} ${prod?.unit || 'L'} of ${prod?.name} (₹${calculatedAmount}) for ${scannedCustomer.name}!`);
        setLastRecordedTx(res.data.transaction);
        setNotes('');

        // Refresh customer history & today's status
        fetchCustomerHistory(scannedCustomer._id);
      }
    } catch (err) {
      showError(err.message || 'Failed to record transaction');
    } finally {
      setSubmittingTx(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const unitPrice = selectedProduct?.price || 0;
  const numQty = parseFloat(quantity) || 0;
  const totalAmount = Math.round(numQty * unitPrice * 100) / 100;

  return (
    <div>
      {/* Hidden container for file scan */}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>

      {/* SCANNER TERMINAL PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-charcoal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '12px 16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF' }}>
            <QrCode size={18} />
            <span>Customer QR Verification & Delivery Terminal</span>
          </h3>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'demo' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'demo' ? { background: 'var(--project-primary)', color: 'var(--project-charcoal-dark)', fontWeight: 700 } : { background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
              onClick={() => setActiveTab('demo')}
            >
              <Sparkles size={14} />
              <span>Customer QR Cards</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'camera' ? { background: 'var(--project-primary)', color: 'var(--project-charcoal-dark)', fontWeight: 700 } : { background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
              onClick={() => setActiveTab('camera')}
            >
              <Camera size={14} />
              <span>Camera Scan</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === 'manual' ? { background: 'var(--project-primary)', color: 'var(--project-charcoal-dark)', fontWeight: 700 } : { background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
              onClick={() => setActiveTab('manual')}
            >
              <Keyboard size={14} />
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
                  <strong>QR Scan Test Terminal:</strong> Click <strong>"Scan Customer QR"</strong> on any customer below. The scanner will verify their profile, check route assignment, and open today's delivery recording form!
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={fetchInitialData}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Refresh customer registry from database"
                  >
                    <RefreshCw size={12} />
                    <span>Sync List</span>
                  </button>
                  <label className="btn btn-xs btn-outline" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
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
                    const isSelected = scannedCustomer?._id === c._id;
                    return (
                      <div
                        key={c._id}
                        style={{
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          border: `2px solid ${isSelected ? '#16a34a' : isAssignedToMe ? 'var(--border-medium)' : '#fca5a5'}`,
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

                        {/* Customer Photo or Avatar */}
                        {c.profileImage || c.image ? (
                          <img
                            src={c.profileImage || c.image}
                            alt={c.name}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.35rem', border: '1px solid var(--border-medium)' }}
                          />
                        ) : null}

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

                        <div className="badge-qr-token" style={{ marginBottom: '0.25rem' }}>
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
                          onClick={() => handleSelectCustomerCard(c)}
                          disabled={loading}
                        >
                          <QrCode size={12} />
                          <span>{isAssignedToMe ? (isSelected ? 'Selected ✓' : 'Scan & Record Milk') : 'Test 403 Scan'}</span>
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
              {/* Camera Controls Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {cameras.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Camera size={14} style={{ color: 'var(--primary-red)' }} />
                    <select
                      className="form-control"
                      style={{ width: 'auto', fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        startCamera(e.target.value);
                      }}
                    >
                      {cameras.map((c, idx) => (
                        <option key={c.id} value={c.id}>
                          {c.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scanning ? (
                  <button type="button" className="btn btn-xs btn-outline" onClick={stopCamera}>
                    <StopCircle size={13} />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    onClick={() => startCamera(selectedCameraId)}
                    disabled={startingCamera}
                  >
                    <Camera size={13} />
                    <span>{startingCamera ? 'Starting Camera...' : 'Open / Start Camera'}</span>
                  </button>
                )}

                <label className="btn btn-xs btn-outline" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Upload size={13} />
                  <span>Scan QR from Image File</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
              </div>

              {/* Camera Error / Warning Banner */}
              {cameraError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.75rem 1rem',
                  color: '#991b1b',
                  fontSize: '0.82rem',
                  maxWidth: '520px',
                  margin: '0 auto 1rem auto',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Camera Notice:</strong> {cameraError}
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => startCamera(selectedCameraId)}
                          disabled={startingCamera}
                        >
                          Retry Camera
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setActiveTab('demo')}
                        >
                          Use Visual Test Terminal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport */}
              <div id="qr-reader-viewport" className="scanner-viewport"></div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Point device camera at any printed or displayed Customer QR Pass. Scanner captures automatically upon alignment.
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
                  {loading ? 'Verifying Pass...' : 'Verify Token & Open Delivery Form'}
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* VERIFIED CUSTOMER PROFILE & DISTRIBUTION PANEL */}
      {scannedCustomer && (
        <div className="enterprise-panel" style={{ border: '2px solid var(--project-primary)' }}>
          <div className="panel-banner-charcoal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '12px 16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--project-primary)' }} />
              <span>Verified Customer: {scannedCustomer.name}</span>
            </h3>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ background: '#FFFFFF', color: '#DC2626', borderColor: '#FECACA', fontWeight: 600 }}
              onClick={() => {
                setScannedCustomer(null);
                lastScannedTokenRef.current = '';
                isProcessingRef.current = false;
              }}
            >
              <X size={14} />
              <span>Clear Scan</span>
            </button>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Customer Details Strip */}
            <div style={{
              background: '#fdfbf7',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xs)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              {/* Left Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {scannedCustomer.image ? (
                  <img
                    src={scannedCustomer.image}
                    alt={scannedCustomer.name}
                    style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-xs)', objectFit: 'cover', border: '1px solid var(--border-medium)' }}
                  />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-xs)', background: '#f5ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-red)' }}>
                    {scannedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-heading)' }}>
                    {scannedCustomer.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                    <span className="badge-qr-token">{scannedCustomer.qrToken}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      📱 {scannedCustomer.mobile}
                    </span>
                  </div>
                  {scannedCustomer.address && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      📍 {scannedCustomer.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Center Identity */}
              <div style={{ fontSize: '0.78rem' }}>
                <div><strong>Aadhaar:</strong> {scannedCustomer.adharNumber || 'Not provided'}</div>
                <div><strong>PAN Card:</strong> {scannedCustomer.panNumber || 'Not provided'}</div>
                <div><strong>Assigned Admin:</strong> <span style={{ color: 'var(--primary-red)', fontWeight: 700 }}>{scannedCustomer.adminId?.name || 'Assigned Staff'}</span></div>
              </div>

              {/* Right: Today's Delivery Status */}
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>
                  Today's Status
                </div>
                {customerTodayStatus?.delivered ? (
                  <span className="badge-status-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
                    <CheckCircle2 size={13} />
                    <span>Delivered Today ({customerTodayStatus.totalQty} Units • ₹{customerTodayStatus.totalAmt})</span>
                  </span>
                ) : (
                  <span className="badge-status-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                    <AlertCircle size={13} />
                    <span>Left for Today (Pending)</span>
                  </span>
                )}
              </div>
            </div>

            {/* DISTRIBUTION FORM */}
            <form onSubmit={handleRecordDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-xs)', padding: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={16} style={{ color: 'var(--primary-red)' }} />
                <span>Record Today's Milk / Product Taken</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Select Dairy Product *
                  </label>
                  <select
                    className="form-control"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.category || 'Dairy'}) — ₹{p.price}/{p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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

              {/* Dynamic Live Rate Calculation Box */}
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
                    Dynamic Real-Time Billing Breakdown
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
                    Total Billable Amount
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', lineHeight: 1.1 }}>
                    ₹{totalAmount}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Morning delivery, Cash received"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-success"
                disabled={submittingTx || numQty <= 0}
                style={{ padding: '0.8rem', fontSize: '0.92rem', fontWeight: 800 }}
              >
                <CheckCircle2 size={16} />
                <span>{submittingTx ? 'Saving Transaction...' : `Confirm & Save Today's Delivery (₹${totalAmount})`}</span>
              </button>
            </form>

            {/* PRIOR TRANSACTION HISTORY SECTION */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)' }}>
                <Clock size={16} style={{ color: 'var(--primary-red)' }} />
                <span>Recent Milk Delivery Ledger for {scannedCustomer.name} ({history.length})</span>
              </div>

              {loadingHistory ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#fdfbf7', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
                  No prior delivery records found for this customer.
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Rate Snapshot</th>
                        <th>Total Amount</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((tx) => (
                        <tr key={tx._id}>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td style={{ fontWeight: 700 }}>{tx.productName}</td>
                          <td>{tx.quantity} {tx.unit}</td>
                          <td style={{ color: 'var(--text-muted)' }}>₹{tx.priceAtTransaction}/{tx.unit}</td>
                          <td style={{ fontWeight: 800, color: '#15803d' }}>₹{tx.totalAmount}</td>
                          <td style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{tx.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
