// client/src/pages/Register.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register(){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('voter'); // default
  const [adminCode, setAdminCode] = useState(''); // optional client-side guard
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const nav = useNavigate();

  async function handle(e){
    e.preventDefault();
    setError('');
    setLoading(true);

    // Optional client-side check: require admin code to choose admin role.
    // This is only UX-level — you MUST also enforce on server.
    if (role === 'admin' && !adminCode.trim()) {
      setError('Admin code required to register as admin');
      setLoading(false);
      return;
    }

    try {
      await register({ name, email, password, role, adminCode });
      nav('/login');
    } catch(err) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '28px auto' }}>
      <h1 className="h1">Create your account</h1>
      <p className="note">Fill in the details to register.</p>

      <form onSubmit={handle} style={{ marginTop: 16 }}>
        <div className="form-row">
          <label className="form-label">Full Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="form-row">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="form-row">
          <label className="form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="form-row">
          <label className="form-label">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="voter">Voter</option>
            <option value="candidate">Candidate</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* optional: show an admin code field when Admin is selected */}
        {role === 'admin' && (
          <div className="form-row">
            <label className="form-label">Admin code (required)</label>
            <input
              value={adminCode}
              onChange={e => setAdminCode(e.target.value)}
              placeholder="Enter admin invite code"
              required
            />
            <div className="note" style={{ marginTop: 6 }}>
              Registering as admin should be restricted. Server must validate this code or your own admin-creation flow.
            </div>
          </div>
        )}

        {error && <div className="message" role="alert" style={{ marginTop: 8 }}>{error}</div>}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 16 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register'}
          </button>

          <div className="note" style={{ fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-600)', fontWeight: 600 }}>
              Login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
