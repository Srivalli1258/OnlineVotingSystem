// client/src/pages/CreateElection.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import adminApi from '../api/adminApi';

export default function CreateElection() {
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [candidateEligibility, setCandidateEligibility] = useState('');
  const [voterEligibility, setVoterEligibility] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

    async function handleCreate(e) {
  e.preventDefault();
  setError(null);
  setLoading(true);

  // Make admin decision robust: check AuthContext user OR localStorage adminToken
  const isAdminFromUser = !!(user && String(user.role || '').toLowerCase() === 'admin');
  const hasAdminToken = !!localStorage.getItem('adminToken') || !!localStorage.getItem('token');
  const isAdmin = isAdminFromUser || hasAdminToken;

  if (!isAdmin) {
    setError('Only admins can create elections. Please login as admin.');
    setLoading(false);
    return;
  }

  try {
    const payload = {
      title,
      description,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      endAt: endAt ? new Date(endAt).toISOString() : null,
      candidateEligibility,
      eligibility: voterEligibility
    };
    // const res = await api.post('/admin/elections', payload);
    
    const res = await adminApi.post('/elections',payload);
    setSuccess('Election created');
    const id = res?.data?.election?._id || res?.data?._id || res?.data?.id;
    setTimeout(() => {
      if (id) nav(`/elections/${id}`);
      else nav('/elections');
    }, 900);
  } catch (err) {
    setError(err?.response?.data?.message || err.message || 'Failed to create election');
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="card" style={{ maxWidth: 800, margin: '20px auto' }}>
      <h1 className="h1">Create Election</h1>
      <p className="note">Only admins can create elections. Fill required fields below.</p>

      <form onSubmit={handleCreate} style={{ marginTop: 12 }}>
        <div className="form-row">
          <label className="form-label">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="form-row">
          <label className="form-label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="form-row" style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Start At</label>
            <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">End At</label>
            <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">Candidate Eligibility (rules for who may run)</label>
          <textarea value={candidateEligibility} onChange={e => setCandidateEligibility(e.target.value)} rows={3} placeholder="e.g., Must be 25+, resident of constituency..." />
        </div>

        <div className="form-row">
          <label className="form-label">Voter Eligibility (optional)</label>
          <input value={voterEligibility} onChange={e => setVoterEligibility(e.target.value)} placeholder="e.g., Registered voters of X" />
        </div>

        {error && <div className="message" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
        {success && <div className="message success" style={{ marginBottom: 12, background: '#eefbe9', borderColor: '#bbf0c4', color:'#065f46' }}>{success}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Election'}</button>
          <button type="button" className="btn secondary" onClick={() => nav('/elections')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
