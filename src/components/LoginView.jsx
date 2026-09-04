import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Milk,
  Lock,
  Mail,
  ArrowRight,
  Star,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const LoginView = () => {
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgConfig, setOrgConfig] = useState({ orgName: 'Milky Dairy', orgLogo: '' });

  useEffect(() => {
    api.getSystemConfig()
      .then((res) => {
        if (res.success && res.data?.config) {
          setOrgConfig(res.data.config);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      showSuccess('Signed in successfully!');
    } catch (err) {
      showError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Top Header */}
      <header className="login-header" style={{
        width: '100%',
        maxWidth: '1040px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(76, 220, 156, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2C373B'
          }}>
            <img
              src={orgConfig.orgLogo || '/applogo.png'}
              alt="Logo"
              style={{ height: '30px', width: '30px', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2C373B', letterSpacing: '-0.02em' }}>
              {orgConfig.orgName || 'Milky'}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857', marginLeft: '6px' }}>
              • Dairy ERP
            </span>
          </div>
        </div>

        <div className="desktop-only" style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#2C373B',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '6px 14px',
          borderRadius: '9999px',
          border: '1px solid #A7F3D0'
        }}>
          Customer QR & Milk Distribution System
        </div>
      </header>

      {/* Main Responsive Grid */}
      <div style={{
        width: '100%',
        maxWidth: '1040px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '40px',
        alignItems: 'center',
        padding: '0 16px'
      }}>
        {/* Login Card */}
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid rgba(44, 55, 59, 0.2)',
            boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }}>
            {/* Card Header */}
            <div style={{
              background: '#23292F',
              color: '#FFFFFF',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
                <KeyRound size={18} style={{ color: '#4CDC9C' }} />
                <span>Portal Sign In</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                background: 'rgba(76, 220, 156, 0.2)',
                color: '#4CDC9C',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: 600
              }}>
                Secure 256-Bit
              </span>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '3px solid #4CDC9C',
                  boxShadow: '0 6px 16px rgba(76, 220, 156, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginBottom: '0.6rem'
                }}>
                  <img
                    src={orgConfig.orgLogo || '/applogo.png'}
                    alt="Milky Dairy Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2C373B', margin: 0 }}>
                  {orgConfig.orgName || 'Milky Dairy ERP'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, marginTop: '2px' }}>
                  Smart QR & Daily Milk Distribution
                </span>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label className="form-label">
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(44, 55, 59, 0.5)' }} />
                    <input
                      type="email"
                      className="form-control"
                      style={{ paddingLeft: '2.4rem' }}
                      placeholder="Enter registered email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(44, 55, 59, 0.5)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                      placeholder="Enter account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(44, 55, 59, 0.6)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '11px',
                    marginTop: '0.4rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '4px 12px',
            background: '#D1FAE5',
            border: '1px solid #A7F3D0',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#047857',
            marginBottom: '1.2rem'
          }}>
            <CheckCircle2 size={14} />
            <span>Next-Gen Dairy Distribution Management</span>
          </div>

          <h1 style={{
            fontFamily: "'Montserrat', Arial, Helvetica, sans-serif",
            fontSize: '2.4rem',
            fontWeight: 700,
            color: '#2C373B',
            lineHeight: 1.2,
            marginBottom: '1rem'
          }}>
            Smart Customer QR Pass & <span style={{ color: '#047857' }}>Milk Delivery ERP</span>
          </h1>

          <p style={{
            fontSize: '0.95rem',
            color: '#4B5563',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
            maxWidth: '480px'
          }}>
            Enterprise QR-driven delivery tracking, role-based isolation across routes, dynamic multi-unit pricing catalogs (Litre, Kg, Pack), and automated customer billing records.
          </p>

          <div style={{
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            color: '#6B7280',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Star size={15} fill="#FFBB31" color="#FFBB31" />
              <span style={{ color: '#2C373B' }}><strong>99.9%</strong> Route Accuracy</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={15} style={{ color: '#4CDC9C' }} />
              <span>Admin Route Isolation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
