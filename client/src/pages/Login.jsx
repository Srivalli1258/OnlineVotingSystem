// client/src/pages/Login.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  const { login } = useContext(AuthContext);
  const nav = useNavigate();
  const timerRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);

  async function handle(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });

      // Show success popup/toast
      setSuccessToast(true);

      // After a short delay, clear toast and navigate to /elections
      timerRef.current = setTimeout(() => {
        setSuccessToast(false);
        nav('/elections');
      }, 1200); // 1200ms gives users a moment to read the popup
    } catch (err) {
      // focus appropriate field for accessibility
      setError(err?.response?.data?.message || err?.message || 'Login failed');
      if (!email) {
        emailRef.current?.focus();
      } else {
        passRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  // Clean up timer and toast if component unmounts before navigation
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSuccessToast(false);
    };
  }, []);

  return (
    <div className="card" style={{ maxWidth: 520, margin: '28px auto', position: 'relative' }}>
      <h1 className="h1">Log in</h1>
      <p className="note">Enter your email and password to continue.</p>

      <form onSubmit={handle} style={{ marginTop: 12 }}>
        <div className="form-row">
          <label className="form-label">Email</label>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="form-row">
          <label className="form-label">Password</label>
          <input
            ref={passRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && <div className="message" role="alert">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>

          <div className="note" style={{ fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-600)', fontWeight: 600 }}>
              Sign up
            </Link>
          </div>
        </div>
      </form>

      {/* Success toast / popup */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 28,
            background: 'linear-gradient(180deg,#fff,#f8fffb)',
            border: '1px solid rgba(34,197,94,0.15)',
            boxShadow: '0 6px 18px rgba(16,24,40,0.08)',
            padding: '12px 18px',
            borderRadius: 10,
            color: '#065f46',
            fontWeight: 600,
            zIndex: 9999,
          }}
        >
          ✅ Login successful
        </div>
      )}
    </div>
  );
}
