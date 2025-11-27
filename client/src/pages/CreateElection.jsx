// client/src/pages/CreateElection.jsx
import React, { useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CreateElection() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [candidateEligibility, setCandidateEligibility] = useState('');
  const [eligibility, setEligibility] = useState(''); // voter eligibility if needed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const nav = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    if (!title) return setError('Title is required');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        startAt: startAt || undefined,
        endAt: endAt || undefined,
        candidateEligibility,
        eligibility
      };

      const res = await api.post('/elections', payload);
      setLoading(false);
      nav(`/elections/${res.data.election._id}`);
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || 'Create failed');
    }
  }

  if (!user || String(user.role).toLowerCase() !== 'admin') {
    return <div className="message error">Only admins can create elections.</div>;
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <h2>Create Election</h2>
      {error && <div className="message error">{error}</div>}
      <form onSubmit={handleCreate}>
        <label>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="input" required />

        <label>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input" />

        <label>Start At</label>
        <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="input" />

        <label>End At</label>
        <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className="input" />

        <label>Candidate Eligibility (rules for who may run)</label>
        <textarea
          value={candidateEligibility}
          onChange={e => setCandidateEligibility(e.target.value)}
          placeholder="e.g., Must be 25+, resident of constituency, not convicted of offense..."
          className="input"
          rows={4}
        />

        <label>Voter Eligibility (optional)</label>
        <input value={eligibility} onChange={e => setEligibility(e.target.value)} className="input" />

        <div style={{ marginTop: 12 }}>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Election'}</button>
        </div>
      </form>
    </div>
  );
}
