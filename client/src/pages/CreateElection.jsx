
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function CreateElection() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect non-admin/non-user (optional safety)
  if (!user) {
    // not logged in
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowedVotersText, setAllowedVotersText] = useState(''); // comma separated emails or ids
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to parse allowed voters input into array (optional: convert emails to ids on backend)
  const parseAllowed = (text) =>
    text.split(',').map(s => s.trim()).filter(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title,
        description,
        startAt: startAt || undefined,
        endAt: endAt || undefined,
        isPublic,
        allowedVoters: parseAllowed(allowedVotersText) // depends on backend expectations
      };
      const res = await api.post('/elections', payload);
      // res.data should be the created election
      setLoading(false);
      // navigate to election details page OR the elections list
      navigate(`/elections/${res.data._id || res.data.id || res.data._doc?._id}`);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Failed to create');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div className="card">
        <h1 className="h1">Create Election</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Election title" required />
          </div>

          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description" rows={4} />
          </div>

          <div className="grid cols-2" style={{ alignItems: 'start' }}>
            <div>
              <div className="form-row">
                <label className="form-label">Start (optional)</label>
                <input type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">End (optional)</label>
                <input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="form-row">
                <label className="form-label">Public</label>
                <select value={isPublic ? 'true' : 'false'} onChange={e=>setIsPublic(e.target.value === 'true')}>
                  <option value="true">Public (any registered voter)</option>
                  <option value="false">Restricted (only listed voters)</option>
                </select>
              </div>

              {!isPublic && (
                <div className="form-row">
                  <label className="form-label">Allowed voters (emails or ids comma-separated)</label>
                  <textarea value={allowedVotersText} onChange={e=>setAllowedVotersText(e.target.value)} placeholder="alice@example.com, bob@example.com" />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Posting…' : 'Create Election'}
            </button>
            <button type="button" className="btn secondary" onClick={()=>navigate('/elections')} style={{ marginLeft: 10 }}>Cancel</button>
          </div>

          {error && <div className="message" style={{ marginTop: 12 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
