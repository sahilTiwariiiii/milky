import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Milk,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Star,
  Heart
} from 'lucide-react';

export const LoginView = () => {
  const { login, quickLogin } = useAuth();
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState('admin@dairy.com');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please provide both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showSuccess('Signed in successfully!');
    } catch (err) {
      showError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (account) => {
    setLoading(true);
    try {
      await quickLogin(account);
      showSuccess(`Signed in as ${account.title}!`);
    } catch (err) {
      showError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, #ffffff 0%, #faf8f7 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Iconic  Red Polka Dot Ribbon (from reference image) */}
      <div className="amul-polka-ribbon" title="The Taste of India" />

      {/* Top Header */}
      <header style={{
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-medium)',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 800,
            fontSize: '1.6rem',
            color: 'var(--primary-red)',
            letterSpacing: '-0.02em'
          }}>
            Amul
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            • The Taste of India ERP
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-red)' }}>
          <span>Pure • Fresh • Farmer-Owned Dairy</span>
        </div>
      </header>

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        maxWidth: '1140px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        alignItems: 'center',
        gap: '2.5rem'
      }}>
        {/* Left Hero (Inspired by the Reference Image) */}
        <div>
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
            <span>The Taste of India</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2.6rem',
            fontWeight: 800,
            color: '#1a1a1a',
            lineHeight: 1.15,
            marginBottom: '1rem'
          }}>
            The brand owned, <br />
            shaped and powered <br />
            <span style={{ color: 'var(--primary-red)' }}>by farmers.</span>
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '21px', marginBottom: '1.5rem', maxWidth: '460px' }}>
            Enterprise Customer QR distribution, live route isolation, multi-unit catalog pricing (Litre, Pack, Pouch, kg), and real-time billing ledger.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span><strong>4.9</strong> rating</span>
            </div>
            <span>•</span>
            <div>3.6 Million+ Farmers</div>
            <span>•</span>
            <div>Daily Fresh Distribution</div>
          </div>
        </div>

        {/* Right Login Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}>
          {/* Header Banner */}
          <div style={{
            background: 'var(--primary-red)',
            color: '#fff',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Management Portal Login</div>
            <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.22)', padding: '0.15rem 0.45rem', borderRadius: '3px' }}>
              v2.0
            </span>
          </div>

          <div style={{ padding: '1.35rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '2rem' }}
                    placeholder="admin@dairy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '2rem' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.7rem', marginTop: '0.35rem' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight size={14} />
              </button>
            </form>

            {/* 1-Click Demo Accounts */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-red)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={13} />
                <span>1-Click Test Accounts</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoClick(acc)}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.8rem',
                      background: '#fdfdfd',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-red)';
                      e.currentTarget.style.background = 'var(--primary-red-soft)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-medium)';
                      e.currentTarget.style.background = '#fdfdfd';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a1a1a' }}>{acc.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.desc}</div>
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-red)' }}>Login &rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
