// client/src/pages/ElectionDetail.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

/**
 * ElectionDetail page
 * - Robust role detection (normalizes user.role casing + JWT fallback)
 * - Only users with role 'voter' see and can use "Cast Vote"
 * - Only users with role 'admin' see "View Votes" (and cannot vote)
 * - Other roles (candidate/user/guest) see info and can register as candidate where allowed
 *
 * This component expects the CSS you already added to index.css (tabs/styles).
 * The uploaded screenshot path is used for header preview:
 */
const IMAGE_SRC = '/mnt/data/Screenshot 2025-11-25 153320.png';

function formatDate(dt) {
  if (!dt) return 'N/A';
  try { return new Date(dt).toLocaleString(); } catch { return String(dt); }
}

function getRoleFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // common claim locations
    return payload.role || payload?.user?.role || payload?.roleName || null;
  } catch (e) {
    return null;
  }
}

export default function ElectionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('Overview');
  const [selected, setSelected] = useState('');
  const [voting, setVoting] = useState(false);

  const [participating, setParticipating] = useState(false);
  const [partErr, setPartErr] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // admin results
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const isMounted = useRef(true);

  // Normalize role each render: prefer AuthContext user.role, fallback to JWT token
  const rawRole = user?.role ?? getRoleFromToken();
  const role = String(rawRole ?? '').trim().toLowerCase();
  const isAdmin = role === 'admin';
  const isVoter = role === 'voter';

  // Debugging: prints user and normalized role (remove in production)
  // Useful to confirm why someone sees wrong tabs
  // eslint-disable-next-line no-console
  console.debug('ElectionDetail role debug:', { user, normalizedRole: role, isAdmin, isVoter });

  // compute tabs on every render so they update when user becomes available
  const baseTabs = ['Overview', 'Candidates', 'Schemes', 'Eligibility'];
  const tabs = isAdmin ? [...baseTabs, 'View Votes'] : isVoter ? [...baseTabs, 'Cast Vote'] : [...baseTabs];

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.get(`/elections/${id}`);
      const payload = res.data || {};

      // normalize into expected shape { election, candidates, canVote, hasVoted, votedFor, isCandidate }
      let normalized;
      if (payload.election) {
        normalized = payload;
      } else if (payload._id || payload.id) {
        normalized = {
          election: payload,
          candidates: payload.candidates || [],
          canVote: payload.canVote || false,
          hasVoted: payload.hasVoted || false,
          votedFor: payload.votedFor || null,
          isCandidate: payload.isCandidate || false
        };
      } else {
        normalized = payload;
      }

      if (!isMounted.current) return;
      setData(normalized);
      if (normalized.votedFor) setSelected(normalized.votedFor);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err?.response?.data?.message || 'Could not load election');
      setData(null);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // ADMIN: fetch vote counts
  async function loadResults() {
    if (!isAdmin) return;
    setLoadingResults(true);
    setResults(null);
    try {
      const res = await api.get(`/elections/${id}/results`);
      const payload = res.data || {};

      let normalized = [];
      if (Array.isArray(payload.results)) {
        normalized = payload.results;
      } else if (payload && typeof payload === 'object') {
        normalized = Object.keys(payload).map(k => {
          const v = payload[k];
          // if server returns { candidateId: count } or similar
          if (typeof v === 'number') return { candidate: { id: k, name: k }, count: v };
          return v;
        });
      }

      if (!isMounted.current) return;
      setResults(normalized);
    } catch (err) {
      // keep empty results but show UI
      // eslint-disable-next-line no-console
      console.error('Failed loadResults', err);
      setResults([]);
    } finally {
      if (isMounted.current) setLoadingResults(false);
    }
  }

  // Only voters can cast votes
  async function handleVote(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!user) { nav('/login'); return; }
    if (!isVoter) { setError('Only users with voter role may cast a vote.'); return; }

    if (!selected) { setError('Please select a candidate'); return; }
    if (!data?.canVote) { setError('You are not eligible to vote in this election'); return; }
    if (data?.hasVoted) { setError('You have already voted in this election'); return; }

    setVoting(true);
    try {
      await api.post(`/elections/${id}/vote`, { candidateId: selected });
      setData(prev => prev ? { ...prev, hasVoted: true, votedFor: selected } : prev);
      setMessage('Vote cast successfully — redirecting to list...');
      setTimeout(() => nav('/elections'), 900);
    } catch (err) {
      setError(err?.response?.data?.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  }

  // Candidate participation (unchanged)
  async function handleParticipate(e) {
    e.preventDefault();
    setPartErr('');
    setError(null);
    setMessage(null);
    if (!user) { nav('/login'); return; }
    if (!(user.role === 'candidate' || user.role === 'user')) {
      setPartErr('Only users with candidate role can participate');
      return;
    }
    setParticipating(true);
    try {
      const name = user.name || user.email || 'Candidate';
      const description = `${name}'s manifesto`;
      const res = await api.post(`/elections/${id}/candidates`, { name, description });
      setData(prev => prev ? { ...prev, candidates: [...(prev.candidates || []), res.data] } : prev);
      setMessage('Registered as candidate successfully.');
      setTab('Candidates');
    } catch (err) {
      setPartErr(err?.response?.data?.message || 'Failed to register as candidate');
    } finally {
      setParticipating(false);
    }
  }

  function topResult(resultsArr = []) {
    if (!Array.isArray(resultsArr) || resultsArr.length === 0) return null;
    const sorted = [...resultsArr].sort((a, b) => (b.count || 0) - (a.count || 0));
    return sorted[0];
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!data || !data.election) return <div style={{ padding: 20 }}>Election not found.</div>;

  const { election, candidates = [], canVote = false, hasVoted = false, votedFor = null, isCandidate = false } = data;

  return (
    <div className="election-page">
      <div className="election-header">
        <div>
          <h1 className="title">{election.title}</h1>
          <div className="subtitle">{election.description}</div>
        </div>
        <div className="ref-image">
          <img alt="reference" src={IMAGE_SRC} style={{ maxHeight: 72, borderRadius: 6 }} />
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => {
              setTab(t);
              setError(null);
              setMessage(null);
              if (isAdmin && t === 'View Votes') loadResults();
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="tab-body">
        {message && <div className="message success" style={{ marginBottom: 12 }}>{message}</div>}
        {error && <div className="message error" style={{ marginBottom: 12 }}>{error}</div>}
        {partErr && <div className="message error" style={{ marginBottom: 12 }}>{partErr}</div>}

        {/* Overview */}
        {tab === 'Overview' && (
          <div className="card overview-grid">
            <div>
              <p><strong>Category:</strong> {election.category || 'General'}</p>
              <p><strong>Start:</strong> {formatDate(election.startAt)}</p>
              <p><strong>End:</strong> {formatDate(election.endAt)}</p>
            </div>
            <div>
              <p><strong>Created:</strong> {formatDate(election.createdAt)}</p>
              <p><strong>Status:</strong> {new Date() < new Date(election.startAt || 0) ? 'Upcoming' : (new Date() > new Date(election.endAt || Infinity) ? 'Closed' : 'Open')}</p>
              <p><strong>Eligibility:</strong> {election.eligibility || 'Registered voters'}</p>
            </div>
          </div>
        )}

        {/* Candidates */}
        {tab === 'Candidates' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Candidates</h3>
              <div>
                {isCandidate && <span className="note" style={{ fontWeight: 700 }}>You are a candidate</span>}
                {!isCandidate && user && (user.role === 'candidate' || user.role === 'user') && (
                  <button className="btn" onClick={handleParticipate} disabled={participating} style={{ marginLeft: 12 }}>
                    {participating ? 'Registering…' : 'Participate as candidate'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {candidates.length === 0 && <div className="note">No candidates yet.</div>}
              {candidates.map(c => (
                <div key={c._id || c.id} className="candidate-card">
                  <div className="cand-top">
                    <div className="cand-name">{c.name}</div>
                    <div className="cand-meta">{c.party || ''} {c.schemes && c.schemes.length ? `• ${c.schemes.length} schemes` : ''}</div>
                  </div>
                  <div className="note" style={{ marginTop: 8 }}>{c.description || 'No manifesto provided.'}</div>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn secondary" onClick={() => setTab('Schemes')}>View schemes</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schemes */}
        {tab === 'Schemes' && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Schemes for Candidates</h3>
            {candidates.length === 0 && <div className="note">No candidates / schemes yet.</div>}
            {candidates.map(c => (
              <div key={c._id || c.id} className="scheme-block">
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <ul>
                  {Array.isArray(c.schemes) && c.schemes.length
                    ? c.schemes.map((s, i) => <li key={i} className="note">• {s}</li>)
                    : <li className="note">No schemes listed for this candidate.</li>}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Eligibility */}
        {tab === 'Eligibility' && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Eligibility Criteria to Participate</h3>
            <p className="note">{election.eligibility || 'General eligibility: registered account, meet age & residency requirements. Specific criteria may be added by admin.'}</p>
            <ol>
              <li>Registered on this portal</li>
              <li>Meet age/residency requirements</li>
              <li>Not disqualified by rules or admin</li>
              <li>Accept terms & submit required info</li>
            </ol>
            <div style={{ marginTop: 12 }}>
              {!user ? (<button className="btn" onClick={() => nav('/login')}>Login to participate</button>) : (<button className="btn" onClick={() => setTab('Candidates')}>Check Candidate rules</button>)}
            </div>
          </div>
        )}

        {/* Admin-only View Votes */}
        {tab === 'View Votes' && isAdmin && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Votes / Results</h3>
            {loadingResults && <div className="note">Loading results…</div>}
            {!loadingResults && results && results.length === 0 && <div className="note">No votes recorded yet.</div>}
            {!loadingResults && results && results.length > 0 && (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '8px 6px' }}>Candidate</th>
                      <th style={{ padding: '8px 6px' }}>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={r.candidate?.id || r.candidate?._id || idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 6px' }}>{(r.candidate && (r.candidate.name || r.candidate.name === 0)) ? r.candidate.name : (r.candidate?.id || 'Unknown')}</td>
                        <td style={{ padding: '8px 6px', fontWeight: 700 }}>{r.count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 12 }}>
                  <strong>Winner:</strong> {(() => { const top = topResult(results); return top ? `${top.candidate?.name || top.candidate?.id} (${top.count})` : 'No winner yet'; })()}
                </div>
              </>
            )}

            <div style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={() => loadResults()}>Refresh results</button>
              <button className="btn" style={{ marginLeft: 8 }} onClick={() => nav(`/elections/${id}/results`)}>Full results page</button>
            </div>
          </div>
        )}

        {/* Cast Vote: voters only */}
        {tab === 'Cast Vote' && isVoter && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Cast your vote</h3>
            <div className="note">Choose one candidate and submit your vote. Once cast, it cannot be changed.</div>

            <form onSubmit={handleVote} style={{ marginTop: 12 }}>
              {candidates.length === 0 && <div className="note">No candidates available to vote for.</div>}
              {candidates.map(c => (
                <div key={c._id || c.id} className="vote-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div className="note">{c.description}</div>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="radio"
                          name="candidate"
                          value={c._id || c.id}
                          checked={String(selected) === String(c._id || c.id)}
                          onChange={() => setSelected(c._id || c.id)}
                          disabled={!canVote || hasVoted}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <button className="btn" type="submit" disabled={!canVote || hasVoted || voting}>
                  {voting ? 'Casting…' : (hasVoted ? 'Already voted' : 'Cast Vote')}
                </button>
                <button type="button" className="btn secondary" style={{ marginLeft: 8 }} onClick={() => setTab('Overview')}>
                  Back
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
