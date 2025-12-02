// client/src/components/ParticipateForm.jsx
import React, { useState } from 'react';
import api from '../api/axios';

export default function ParticipateForm({
  electionId,
  electionSchemes = [],
  user,
  onRegistered = () => {},
  onClose = () => {}
}) {
  const [form, setForm] = useState({
    name: user?.name || '',
    party: '',
    symbol: '',
    manifesto: '',
    schemes: [], // selected + added schemes
    eligibilityAnswers: {
      verifiedId: false,
      age: ''
    },
    aadhaar: '',
    address: ''
  });

  // local input for adding a custom scheme
  const [newScheme, setNewScheme] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setEligibilityField(key, value) {
    setForm(prev => ({ ...prev, eligibilityAnswers: { ...prev.eligibilityAnswers, [key]: value } }));
  }

  function toggleScheme(scheme) {
    setForm(prev => {
      const s = new Set(prev.schemes || []);
      if (s.has(scheme)) s.delete(scheme); else s.add(scheme);
      return { ...prev, schemes: Array.from(s) };
    });
  }

  function addCustomScheme() {
    const s = String(newScheme || '').trim();
    if (!s) return;
    // Avoid duplicates (case-insensitive)
    const lower = s.toLowerCase();
    const exists = (form.schemes || []).some(x => String(x).toLowerCase() === lower);
    if (!exists) {
      setForm(prev => ({ ...prev, schemes: [...(prev.schemes || []), s] }));
    }
    setNewScheme('');
  }

  function removeScheme(scheme) {
    setForm(prev => ({ ...prev, schemes: (prev.schemes || []).filter(s => s !== scheme) }));
  }

  function validate() {
    setError(null);
    if (!form.name || form.name.trim().length < 2) return 'Please enter your name';
    if (!form.eligibilityAnswers.verifiedId) return 'You must confirm you have a valid ID';
    if (!form.eligibilityAnswers.age || Number(form.eligibilityAnswers.age) < 18) return 'Valid age required (>=18)';

    // If aadhaar provided, validate it is 12 digits
    if (form.aadhaar && !/^\d{12}$/.test(String(form.aadhaar).trim())) {
      return 'Aadhaar must be 12 digits';
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        party: form.party,
        symbol: form.symbol,
        manifesto: form.manifesto,
        schemes: form.schemes,
        eligibilityAnswers: {
          verifiedId: form.eligibilityAnswers.verifiedId,
          age: Number(form.eligibilityAnswers.age)
        },
        // new fields
        aadhaar: form.aadhaar ? String(form.aadhaar).trim() : undefined,
        address: form.address ? String(form.address).trim() : ''
      };

      const res = await api.post(`/elections/${electionId}/candidates/participate`, payload);

      // server often returns { candidate } — guard for both shapes
      const created = (res?.data && (res.data.candidate || res.data)) || res.data;

      setSuccess('Application submitted successfully.');
      // small UX delay so user sees message
      setTimeout(() => {
        onRegistered(created);
      }, 350);

    } catch (err) {
      console.error(err);
      // prefer server message -> fallback to generic
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.details && err.response.data.details.join(', ')) ||
        'Failed to submit';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      {error && <div style={{ color: '#b91c1c', background: '#fff7f7', padding: 8, borderRadius: 6 }}>{error}</div>}
      {success && <div style={{ color: '#065f46', background: '#ecfdf5', padding: 8, borderRadius: 6 }}>{success}</div>}

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13 }}>Full name</label>
        <input name="name" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Your full name" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13 }}>Aadhaar (optional)</label>
        <input name="aadhaar" value={form.aadhaar} onChange={e => setField('aadhaar', e.target.value)} placeholder="12-digit Aadhaar" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13 }}>Address (optional)</label>
        <textarea name="address" value={form.address} onChange={e => setField('address', e.target.value)} rows={3} placeholder="Your address" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13 }}>Party (optional)</label>
        <input name="party" value={form.party} onChange={e => setField('party', e.target.value)} placeholder="Party name" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13 }}>Symbol (image URL or upload link)</label>
        <input name="symbol" value={form.symbol} onChange={e => setField('symbol', e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13 }}>Manifesto</label>
        <textarea name="manifesto" value={form.manifesto} onChange={e => setField('manifesto', e.target.value)} rows={4} placeholder="Short manifesto or key promises" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }} />
      </div>

      {/* Predefined schemes checklist */}
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13, marginBottom: 4 }}>Select predefined schemes (optional)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.isArray(electionSchemes) && electionSchemes.length > 0 ? (
            electionSchemes.map((s, idx) => {
              const id = `scheme-${idx}`;
              const label = s.title || s.code || s;
              const val = s.code || s.title || s;
              const checked = (form.schemes || []).some(x => String(x).toLowerCase() === String(val).toLowerCase());
              return (
                <label key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: checked ? '#f1f5f9' : 'transparent', padding: 6, borderRadius: 6 }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleScheme(val)} />
                  <span style={{ fontSize: 14 }}>{label}</span>
                </label>
              );
            })
          ) : (
            <div style={{ color: '#64748b' }}>No predefined schemes. Add your own below.</div>
          )}
        </div>
      </div>

      {/* Add custom scheme */}
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13 }}>Add your scheme</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={newScheme}
            onChange={e => setNewScheme(e.target.value)}
            placeholder="e.g. Free education for all"
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomScheme(); } }}
          />
          <button type="button" onClick={addCustomScheme} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#0f4bd8', color: '#fff' }}>Add</button>
        </div>

        {/* show added schemes as tags with remove */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(form.schemes || []).map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f1f5f9', borderRadius: 999 }}>
              <span style={{ fontSize: 13 }}>{s}</span>
              <button type="button" onClick={() => removeScheme(s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13 }}>Age</label>
          <input type="number" value={form.eligibilityAnswers.age} onChange={e => setEligibilityField('age', e.target.value)} placeholder="e.g. 30" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>&nbsp;</label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.eligibilityAnswers.verifiedId} onChange={e => setEligibilityField('verifiedId', e.target.checked)} />
            <span style={{ fontSize: 13 }}>I have a valid ID proof</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e6eefc', background: '#fff' }} disabled={loading}>Cancel</button>
        <button type="submit" style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0f4bd8', color: '#fff' }} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </form>
  );
}
