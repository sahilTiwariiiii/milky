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
  KeyRound
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
      {/* Iconic Red Polka Dot Ribbon */}
      <div className="amul-polka-ribbon" title="The Taste of India" />

      {/* Top Header */}
      <header className="login-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {orgConfig.orgLogo ? (
            <img
              src={orgConfig.orgLogo}
              alt="Org Logo"
              style={{ height: '28px', width: 'auto', maxHeight: '28px', objectFit: 'contain' }}
            />
          ) : null}
          <span className="brand-badge-logo">
            {orgConfig.orgName || 'Milky Dairy'}
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            • Dairy ERP Portal
          </span>
        </div>

        <div className="login-header-tagline" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-red)' }}>
          <span>Pure • Fresh • Farmer-Owned Dairy</span>
        </div>
      </header>

      {/* Main Responsive Container */}
      <div className="login-main-grid">
        {/* Login Card (Positioned on top on mobile via order: 1) */}
        <div className="login-card-section">
          <div className="login-card">
            {/* Card Header */}
            <div className="login-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.98rem' }}>
                <KeyRound size={17} />
                <span>Management Portal Login</span>
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.22)', padding: '0.15rem 0.5rem', borderRadius: '3px', fontWeight: 700 }}>
                Secure Access
              </span>
            </div>

            <div className="login-card-body">
              {/* Clean Login Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="email"
                      className="form-control"
                      style={{ paddingLeft: '2.2rem' }}
                      placeholder="Enter registered email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                      placeholder="Enter password"
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
                        right: '0.65rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
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
                    padding: '0.75rem',
                    marginTop: '0.4rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In to Portal'}
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Hero Section (Positioned below login card on mobile via order: 2) */}
        <div className="login-hero-section">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.65rem',
            background: 'var(--primary-red-soft)',
            border: '1px solid var(--primary-red-border)',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: 'var(--primary-red)',
            marginBottom: '1rem'
          }}>
            <Milk size={13} />
            <span>Pure Dairy Ecosystem</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#1a1a1a',
            lineHeight: 1.15,
            marginBottom: '1rem'
          }}>
            The brand owned, <br />
            shaped and powered <br />
            <span style={{ color: 'var(--primary-red)' }}>by farmers.</span>
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '22px', marginBottom: '1.5rem', maxWidth: '460px' }}>
            Enterprise Customer QR distribution, strict route admin isolation, dynamic multi-unit catalog pricing (Litre, kg, gm, ml), and live real-time billing ledger.
          </p>

          <div className="hero-stats" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span><strong>4.9</strong> Rating</span>
            </div>
            <span>•</span>
            <div>3.6 Million+ Farmers</div>
            <span>•</span>
            <div>Daily Fresh Distribution</div>
          </div>
        </div>
      </div>
    </div>
  );
};
