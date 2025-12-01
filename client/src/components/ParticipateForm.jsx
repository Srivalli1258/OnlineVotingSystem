// client/src/components/ParticipateForm.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/axios';

export default function ParticipateForm({ electionId, electionSchemes = [], user, onRegistered }) {
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [schemes, setSchemes] = useState([]);
  const [schemeText, setSchemeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addScheme() {
    if (!schemeText.trim()) return;
    setSchemes(prev => [...prev, schemeText.trim()]);
    setSchemeText('');
  }

  function removeScheme(idx) {
    setSchemes(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required');
    // optional age check:
    if (age && Number(age) < 18) return setError('Minimum age is 18');

    setLoading(true);
    try {
      // payload shape expected by server
      const payload = {
        name: name.trim(),
        age: age ? Number(age) : undefined,
        manifesto: manifesto.trim(),
        schemes
      };

      // NOTE: this calls baseURL + /elections/:id/candidates
      const res = await api.post(`/elections/${electionId}/candidates`, payload);

      // server should respond with candidate + eligibility info
      const candidate = res?.data?.candidate || res?.data;
      const message = res?.data?.message || 'Registered as candidate';

      // if server returned eligibility=false, show message instead of adding
      if (res?.data?.eligible === false) {
        setError(res?.data?.message || 'Not eligible to participate');
      } else {
        onRegistered && onRegistered(candidate);
      }

      // show feedback
      if (message) {
        // minimal UI feedback; parent page often shows messages too
        // you can set a toast or set local state
        // eslint-disable-next-line no-console
        console.log('Participate response:', message);
      }

    } catch (err) {
      // show server error message when available
      setError(err?.response?.data?.message || err?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 760 }}>
      <div className="form-row">
        <label className="form-label">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div className="form-row">
        <label className="form-label">Age</label>
        <input value={age} onChange={e => setAge(e.target.value)} type="number" min="0" />
      </div>

      <div className="form-row">
        <label className="form-label">Manifesto</label>
        <textarea value={manifesto} onChange={e => setManifesto(e.target.value)} rows={4} />
      </div>

      <div className="form-row">
        <label className="form-label">Add Scheme (what you'll implement if elected)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={schemeText} onChange={e => setSchemeText(e.target.value)} placeholder="e.g. Free textbooks" />
          <button type="button" className="btn secondary" onClick={addScheme}>Add</button>
        </div>
        <div className="note" style={{ marginTop: 8 }}>
          {schemes.length === 0 ? 'No schemes added.' : schemes.map((s, i) => (
            <div key={i} style={{ display: 'inline-block', marginRight: 8 }}>
              <span className="vote-card" style={{ padding: 6 }}>{s}</span>
              <button type="button" className="btn secondary" style={{ marginLeft: 6 }} onClick={() => removeScheme(i)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="message" role="alert" style={{ marginTop: 8 }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit participation'}
        </button>
      </div>
    </form>
  );
}

ParticipateForm.propTypes = {
  electionId: PropTypes.string.isRequired,
  electionSchemes: PropTypes.array,
  user: PropTypes.object,
  onRegistered: PropTypes.func
};
