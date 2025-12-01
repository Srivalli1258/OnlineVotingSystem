// client/src/pages/ElectionDetail.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import ParticipateForm from '../components/ParticipateForm';
import CandidateVoteModal from '../components/CandidateVoteModal';

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

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // inline participate
  const [showParticipateInline, setShowParticipateInline] = useState(false);

  // vote-list modal (existing)
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  // admin results
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const isMounted = useRef(true);

  // role
  const rawRole = user?.role ?? getRoleFromToken();
  const role = String(rawRole ?? '').trim().toLowerCase();
  const isAdmin = role === 'admin';
  const isVoter = role === 'voter';
  const canCast = isVoter || role === 'candidate';

  // tabs (no separate Participate tab)
  const baseTabs = ['Overview', 'Candidates', 'Schemes'];
  if (role !== 'voter') baseTabs.push('Eligibility');
  const tabs = isAdmin ? [...baseTabs, 'View Votes'] : canCast ? [...baseTabs, 'Cast Vote'] : [...baseTabs];

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
    // eslint-disable-next-line
  }, [id]);

  async function load() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.get(`/elections/${id}`);
      const payload = res.data || {};
      let normalized;
      if (payload.election) normalized = payload;
      else if (payload._id || payload.id) {
        normalized = {
          election: payload,
          candidates: payload.candidates || [],
          canVote: payload.canVote || false,
          hasVoted: payload.hasVoted || false,
          votedFor: payload.votedFor || null,
          isCandidate: payload.isCandidate || false,
        };
      } else normalized = payload;
      if (!isMounted.current) return;
      setData(normalized);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err?.response?.data?.message || 'Could not load election');
      setData(null);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // admin results
  async function loadResults() {
    if (!isAdmin) return;
    setLoadingResults(true);
    setResults(null);
    try {
      const res = await api.get(`/elections/${id}/results`);
      const payload = res.data || {};
      let normalized = [];
      if (Array.isArray(payload.results)) normalized = payload.results;
      else if (payload && typeof payload === 'object') {
        normalized = Object.keys(payload).map(k => {
          const v = payload[k];
          if (typeof v === 'number') return { candidate: { id: k, name: k }, count: v };
          return v;
        });
      }
      if (!isMounted.current) return;
      setResults(normalized);
    } catch (err) {
      console.error('Failed loadResults', err);
      setResults([]);
    } finally {
      if (isMounted.current) setLoadingResults(false);
    }
  }

  function handleRegisteredCandidate(newCandidate) {
    setData(prev => {
      if (!prev) return prev;
      const cur = { ...prev, candidates: [...(prev.candidates || []), newCandidate] };
      try {
        const uid = user?._id || user?.id || null;
        if (uid && String(newCandidate.createdBy) === String(uid)) cur.isCandidate = true;
      } catch (e) {}
      return cur;
    });
    setShowParticipateInline(false);
    setMessage('Registered as candidate successfully.');
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!data || !data.election) return <div style={{ padding: 20 }}>Election not found.</div>;

  const {
    election,
    candidates = [],
    canVote = false,
    hasVoted = false,
    isCandidate = false
  } = data;

  return (
    <div className="election-page" style={{ padding: '12px 20px' }}>
      <div className="election-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="title">{election.title}</h1>
          <div className="subtitle">{election.description}</div>
        </div>
        <div className="ref-image">
          <img alt="ref" src={IMAGE_SRC} style={{ maxHeight: 72, borderRadius: 6 }} />
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 12 }}>
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

      <div className="tab-body" style={{ marginTop: 14 }}>
        {message && <div className="message success" style={{ marginBottom: 12 }}>{message}</div>}
        {error && <div className="message error" style={{ marginBottom: 12 }}>{error}</div>}

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
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin: 0 }}>Candidates</h3>
              <div>
                {isCandidate && <span className="note" style={{ fontWeight:700 }}>You are a candidate</span>}
                {isAdmin && <button className="btn secondary" onClick={() => nav('/elections/create')} style={{ marginLeft: 12 }}>Manage Elections</button>}
                {!isAdmin && !isCandidate && user && (role === 'candidate' || role === 'user') && (
                  <button className="btn" onClick={() => setShowParticipateInline(prev => !prev)} style={{ marginLeft: 12 }}>
                    {showParticipateInline ? 'Hide form' : 'Participate as candidate'}
                  </button>
                )}
                {!user && <button className="btn" onClick={() => nav('/login')} style={{ marginLeft: 12 }}>Login to participate</button>}
              </div>
            </div>

            {showParticipateInline && (
              <div style={{ marginTop: 12 }}>
                <ParticipateForm
                  electionId={id}
                  electionSchemes={election.schemesList || []}
                  user={user}
                  onRegistered={(cand) => handleRegisteredCandidate(cand)}
                />
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              {candidates.length === 0 && <div className="note">No candidates yet.</div>}
              {candidates.map(c => (
                <div key={c._id || c.id} className="candidate-card" style={{ border:'1px solid #f1f5f9', padding:12, borderRadius:8, marginBottom:12 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:88 }}>
                      {c.symbol ? <img src={c.symbol} alt={c.name} style={{ width:88, height:88, objectFit:'cover', borderRadius:6 }} /> : <div style={{ width:88, height:88, background:'#f8fafc', borderRadius:6 }} />}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div>
                          <div style={{ fontSize:18, fontWeight:600 }}>{c.name}</div>
                          <div className="note">{c.party || ''}</div>
                        </div>
                      </div>

                      {c.manifesto && <div style={{ marginTop:8 }}><strong>Manifesto:</strong> {c.manifesto}</div>}
                      {c.schemes && c.schemes.length > 0 && <div style={{ marginTop:8 }}><strong>Schemes:</strong> {c.schemes.join(', ')}</div>}

                      <div style={{ marginTop:10, display:'flex', gap:8 }}>
                        <button className="btn secondary" onClick={() => setTab('Schemes')}>View schemes</button>
                      </div>
                    </div>
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
              <div key={c._id || c.id} className="scheme-block" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <ul style={{ marginTop: 6 }}>
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
            <p className="note">{election.candidateEligibility || election.eligibility || 'General eligibility: registered account, meet age & residency requirements.'}</p>
            <div style={{ marginTop: 12 }}>
              {!user ? (<button className="btn" onClick={() => nav('/login')}>Login to participate</button>) : (<button className="btn" onClick={() => setTab('Candidates')}>Check Candidate rules</button>)}
            </div>
          </div>
        )}

        {/* Cast Vote (list flow) */}
        {tab === 'Cast Vote' && canCast && (
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ marginTop: 0 }}>Cast your vote</h3>
              {/* Vote (List) modal button remains available */}
              {user && (role === 'voter' || role === 'candidate') && (
                <button className="btn" onClick={() => setVoteModalOpen(true)}>Vote (List)</button>
              )}
            </div>

            <div className="note" style={{ marginBottom: 12 }}>
              Voting is only available via the <strong>Vote (List)</strong> action. Per-candidate buttons have been removed from this view.
            </div>

            {candidates.length === 0 && <div className="note">No candidates available to vote for.</div>}

            {/* Candidate list (no per-item vote controls) */}
            {candidates.map(c => (
              <div key={c._id || c.id} style={{ border:'1px solid #eef2ff', padding:12, borderRadius:8, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{c.name}</div>
                  <div className="note">{c.description || c.manifesto}</div>
                </div>
                <div className="note" style={{ color: '#6b7280' }}>{c.party || ''}</div>
              </div>
            ))}
          </div>
        )}

        {/* View Votes (admin) */}
        {tab === 'View Votes' && isAdmin && (
          <div className="card">
            <h3>Votes / Results</h3>
            {loadingResults && <div className="note">Loading…</div>}
            {!loadingResults && results && results.length === 0 && <div className="note">No votes recorded yet.</div>}
            {!loadingResults && results && results.length > 0 && (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><th style={{ padding:'8px 6px' }}>Candidate</th><th style={{ padding:'8px 6px' }}>Votes</th></tr></thead>
                <tbody>
                  {results.map((r, i) => <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}><td style={{ padding:'8px 6px' }}>{r.candidate?.name}</td><td style={{ padding:'8px 6px', fontWeight:700 }}>{r.count}</td></tr>)}
                </tbody>
              </table>
            )}
            <div style={{ marginTop:12 }}>
              <button className="btn secondary" onClick={() => loadResults()}>Refresh results</button>
            </div>
          </div>
        )}

      </div>

      {/* CandidateVoteModal (existing list modal) */}
      <CandidateVoteModal
        open={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        electionId={id}
        candidates={candidates}
        user={user}
        onVoted={() => { setVoteModalOpen(false); load(); if (isAdmin) loadResults(); }}
      />
    </div>
  );
}
