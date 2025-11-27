// client/src/components/CandidateVoteModal.jsx
import React, { useState } from 'react';
import api from '../api/axios';

export default function CandidateVoteModal({ open, onClose, electionId, candidates = [], user, onVoted }) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  if (!open) return null;

  async function handleVote(candidateId) {
  console.log('CandidateVoteModal.handleVote', { electionId, candidateId });
  if (!user) { window.alert('Please login to vote.'); return; }
  if (!window.confirm('Are you sure you want to cast your vote for this candidate?')) return;

  setError(null);
  setLoadingId(candidateId);
  try {
    const res = await api.post(`/elections/${electionId}/vote`, { candidateId });
    console.log('CandidateVoteModal vote response:', res);
    if (onVoted) onVoted(res.data);
    onClose();
    window.alert(res?.data?.message || 'Vote cast successfully');
  } catch (err) {
    console.error('CandidateVoteModal vote error', err, err?.response?.data);
    setError(err?.response?.data?.message || err?.message || 'Failed to cast vote');
  } finally {
    setLoadingId(null);
  }
}

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{ width: '90%', maxWidth: 820, background: 'white', borderRadius: 8, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Vote — Choose candidate</h3>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>

        {error && <div className="message error" style={{ marginTop: 10 }}>{error}</div>}

        <div style={{ marginTop: 12 }}>
          {candidates.length === 0 && <div className="note">No candidates found.</div>}
          {candidates.map(c => (
            <div key={c._id || c.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #f1f5f9', padding: 10, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ width: 84, height: 84 }}>
                {c.symbol ? (
                  (typeof c.symbol === 'string' && (c.symbol.startsWith('http') || c.symbol.startsWith('data:'))) ? (
                    <img src={c.symbol} alt={c.name} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 6, fontWeight: 700 }}>{String(c.symbol).slice(0,2)}</div>
                  )
                ) : (
                  <div style={{ width: 84, height: 84, background: '#f8fafc', borderRadius: 6 }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <div className="note">{c.description || c.manifesto || 'No manifesto'}</div>
                {c.schemes && c.schemes.length > 0 && <div style={{ marginTop: 6 }}><strong>Schemes:</strong> {c.schemes.join(', ')}</div>}
              </div>

              <div>
                <button
                  className="btn"
                  onClick={() => handleVote(c._id || c.id)}
                  disabled={loadingId !== null}
                >
                  {loadingId === (c._id || c.id) ? 'Voting…' : 'Vote'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
