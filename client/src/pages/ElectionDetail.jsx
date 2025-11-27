// client/src/pages/ElectionDetail.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import ParticipateForm from "../components/ParticipateForm";
import CandidateVoteModal from "../components/CandidateVoteModal";

const IMAGE_SRC = "/mnt/data/Screenshot 2025-11-25 153320.png";

// Utility
function formatDate(dt) {
  if (!dt) return "N/A";
  try { return new Date(dt).toLocaleString(); }
  catch { return String(dt); }
}

// Get role from token as backup
function getRoleFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.role || payload?.user?.role || payload?.roleName || null;
  } catch {
    return null;
  }
}

export default function ElectionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  // state
  const [tab, setTab] = useState("Overview");
  const [selected, setSelected] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [partErr, setPartErr] = useState("");
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // popup/modal
  const [showPopup, setShowPopup] = useState(false);
  const [popupCandidate, setPopupCandidate] = useState(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  const isMounted = useRef(true);

  // roles
  const rawRole = user?.role ?? getRoleFromToken();
  const role = String(rawRole ?? "").trim().toLowerCase();
  const isAdmin = role === "admin";
  const isVoter = role === "voter";
  const canCast = isVoter || role === "candidate";

  // tabs: remove Eligibility for voters only, show Participate only for role === 'user'
  const baseTabs = ["Overview", "Candidates", "Schemes"];
  if (role !== "voter") baseTabs.push("Eligibility");
  const showParticipateTab = !!user && role === "user";

  const tabs = isAdmin
    ? [...baseTabs, "View Votes"]
    : canCast
      ? showParticipateTab
        ? [...baseTabs, "Participate", "Cast Vote"]
        : [...baseTabs, "Cast Vote"]
      : showParticipateTab
        ? [...baseTabs, "Participate"]
        : [...baseTabs];

  // load detail
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
          // support admin-provided candidate eligibility field name
          candidateEligibility: payload.candidateEligibility || payload.candidate_eligibility || payload.candidateEligibilityText || ''
        };
      } else normalized = payload;

      if (!isMounted.current) return;
      setData(normalized);
      if (normalized.votedFor) setSelected(String(normalized.votedFor));
    } catch (err) {
      if (!isMounted.current) return;
      setError(err?.response?.data?.message || "Could not load election");
      setData(null);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // load results (admin)
  async function loadResults() {
    if (!isAdmin) return;
    setLoadingResults(true);
    setResults(null);
    try {
      const res = await api.get(`/elections/${id}/results`);
      const payload = res.data || {};
      let normalized = [];
      if (Array.isArray(payload.results)) normalized = payload.results;
      else if (typeof payload === "object") {
        normalized = Object.keys(payload).map((k) => {
          const v = payload[k];
          if (typeof v === "number") return { candidate: { id: k, name: k }, count: v };
          return v;
        });
      }
      if (!isMounted.current) return;
      setResults(normalized);
    } catch (err) {
      console.error("Failed loadResults", err);
      setResults([]);
    } finally {
      if (isMounted.current) setLoadingResults(false);
    }
  }

  // cast vote
  async function doCastVote(candidateId) {
    setError(null);
    setMessage(null);
    if (!user) return nav("/login");
    if (!canCast) return setError("Not allowed to vote.");
    if (!candidateId) return setError("Please select a candidate.");
    if (!data?.canVote) return setError("You are not eligible.");
    if (data?.hasVoted) return setError("You have already voted.");

    setVoting(true);
    try {
      const res = await api.post(`/elections/${id}/vote`, { candidateId });
      setData((prev) => prev ? ({ ...prev, hasVoted: true, votedFor: candidateId }) : prev);
      await load();
      if (isAdmin) await loadResults();
      setMessage(res?.data?.message || "Vote cast successfully.");
    } catch (err) {
      console.error("Vote error:", err?.response?.data || err);
      setError(err?.response?.data?.message || "Vote failed.");
    } finally {
      setVoting(false);
    }
  }

  function openVotePopup(candidate) {
    setPopupCandidate(candidate);
    setShowPopup(true);
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!data || !data.election) return <div style={{ padding: 20 }}>Election not found</div>;

  const {
    election,
    candidates = [],
    canVote = false,
    hasVoted = false,
    isCandidate = false
  } = data;

  return (
    <div className="election-page">
      {/* HEADER */}
      <div className="election-header">
        <div>
          <h1 className="title">{election.title}</h1>
          <div className="subtitle">{election.description}</div>
        </div>
        <div className="ref-image">
          <img src={IMAGE_SRC} alt="ref" style={{ maxHeight: 72, borderRadius: 6 }} />
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => {
              setTab(t);
              setError(null);
              setMessage(null);
              if (isAdmin && t === "View Votes") loadResults();
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* POPUP */}
      {showPopup && popupCandidate && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 10,
            width: 350,
            boxShadow: "0px 4px 15px rgba(0,0,0,0.3)",
          }}>
            <h3>Confirm Vote</h3>
            <p>You are voting for:</p>
            <p style={{ fontWeight: "bold", fontSize: 18 }}>{popupCandidate?.name}</p>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn secondary" onClick={() => { setShowPopup(false); setPopupCandidate(null); }}>Cancel</button>
              <button className="btn" style={{ marginLeft: 10 }} onClick={async () => {
                await doCastVote(popupCandidate._id || popupCandidate.id);
                setShowPopup(false);
                setPopupCandidate(null);
              }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BODY */}
      <div className="tab-body">
        {message && <div className="message success" style={{ marginBottom: 12 }}>{message}</div>}
        {error && <div className="message error" style={{ marginBottom: 12 }}>{error}</div>}
        {partErr && <div className="message error" style={{ marginBottom: 12 }}>{partErr}</div>}

        {/* Overview */}
        {tab === "Overview" && (
          <div className="card overview-grid">
            <div>
              <p><strong>Category:</strong> {election.category || "General"}</p>
              <p><strong>Start:</strong> {formatDate(election.startAt)}</p>
              <p><strong>End:</strong> {formatDate(election.endAt)}</p>
            </div>
            <div>
              <p><strong>Created:</strong> {formatDate(election.createdAt)}</p>
              <p><strong>Status:</strong>
                {new Date() < new Date(election.startAt || 0) ? "Upcoming"
                  : new Date() > new Date(election.endAt || Infinity) ? "Closed" : "Open"}
              </p>
              <p><strong>Eligibility:</strong> {election.eligibility || "Registered voters"}</p>
            </div>
          </div>
        )}

        {/* Candidates */}
        {tab === "Candidates" && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Candidates</h3>

              <div>
                {isCandidate && <span className="note" style={{ fontWeight: 700 }}>You are a candidate</span>}

                {isAdmin && (
                  <button className="btn secondary" onClick={() => nav('/elections/create')} style={{ marginLeft: 12 }}>
                    Manage Elections
                  </button>
                )}

                {!isAdmin && !isCandidate && user && (role === 'candidate' || role === 'user') && (
                  <button className="btn" onClick={() => setTab('Participate')} style={{ marginLeft: 12 }}>
                    Participate as candidate
                  </button>
                )}

                {!user && (
                  <button className="btn" onClick={() => nav('/login')} style={{ marginLeft: 12 }}>
                    Login to participate
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {candidates.length === 0 && <div className="note">No candidates yet.</div>}

              {candidates.map(c => {
                const cid = String(c._id || c.id || "");
                return (
                  <div key={cid} className="candidate-card" style={{ border: '1px solid #f1f5f9', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 88 }}>
                        {c.symbol ? (
                          <img src={c.symbol} alt={`${c.name} symbol`} style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 6 }} />
                        ) : <div style={{ width: 88, height: 88, background: '#f8fafc', borderRadius: 6 }} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{c.name}</div>
                            <div className="note">{c.party || ''}</div>
                          </div>
                        </div>

                        {c.manifesto && <div style={{ marginTop: 8 }}><strong>Manifesto:</strong> {c.manifesto}</div>}
                        {c.schemes && c.schemes.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <strong>Schemes:</strong> {c.schemes.slice(0, 2).join(', ')}{c.schemes.length > 2 && " ..."}
                          </div>
                        )}

                        <div style={{ marginTop: 10 }}>
                          <button className="btn secondary" onClick={() => setTab('Schemes')}>View Schemes</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cast Vote */}
        {tab === "Cast Vote" && canCast && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Cast your vote</h3>
              {/* optional list modal button */}
              {user && (role === 'voter' || role === 'candidate') && (
                <button className="btn" onClick={() => setVoteModalOpen(true)} style={{ marginLeft: 12 }}>Vote (List)</button>
              )}
            </div>

            <div className="note" style={{ marginTop: 8 }}>Choose one candidate and submit your vote. Once cast, it cannot be changed.</div>

            <form onSubmit={(e) => { e.preventDefault(); const cand = candidates.find(c => String(c._id || c.id) === String(selected)); openVotePopup(cand); }} style={{ marginTop: 12 }}>
              {candidates.length === 0 && <div className="note">No candidates available to vote for.</div>}

              {candidates.map(c => {
                const cid = String(c._id || c.id || "");
                return (
                  <div key={cid} className="vote-card" style={{ border: '1px solid #f1f5f9', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div className="note">{c.description || c.manifesto}</div>
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="radio"
                            name="candidate"
                            value={cid}
                            checked={String(selected) === cid}
                            onChange={() => setSelected(cid)}
                            disabled={!canVote || hasVoted || voting}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 12 }}>
                <button className="btn" type="button" disabled={!selected || hasVoted || voting} onClick={() => {
                  const candidate = candidates.find((c) => String(c._id || c.id) === String(selected));
                  if (!candidate) { setError('Please select a candidate before casting your vote.'); return; }
                  openVotePopup(candidate);
                }}>
                  {voting ? 'Casting…' : (hasVoted ? 'Already voted' : 'Cast Vote')}
                </button>

                <button type="button" className="btn secondary" style={{ marginLeft: 8 }} onClick={() => setTab('Overview')}>Back</button>
              </div>
            </form>
          </div>
        )}

        {/* Schemes */}
        {tab === "Schemes" && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Schemes for Candidates</h3>
            {candidates.length === 0 && <div className="note">No candidates / schemes yet.</div>}
            {candidates.map(c => (
              <div key={String(c._id || c.id)} className="scheme-block" style={{ marginBottom: 12 }}>
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

            <p className="note">
              <strong>Candidate eligibility:</strong>{' '}
              {election.candidateEligibility && election.candidateEligibility.trim()
                ? election.candidateEligibility
                : 'No candidate eligibility rules specified by admin.'}
            </p>

            <p className="note">
              <strong>Voter eligibility:</strong>{' '}
              {election.eligibility && election.eligibility.trim()
                ? election.eligibility
                : 'Registered voters.'}
            </p>
          </div>
        )}

        {/* View Votes (admin) */}
        {tab === "View Votes" && isAdmin && (
          <div className="card">
            <h3>Votes / Results</h3>
            {loadingResults && <div className="note">Loading...</div>}
            {!loadingResults && results && results.length === 0 && <div className="note">No votes yet.</div>}
            {!loadingResults && results && results.length > 0 && (
              <table className="results-table">
                <thead><tr><th>Candidate</th><th>Votes</th></tr></thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}><td>{r.candidate?.name}</td><td>{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <button className="btn secondary" onClick={loadResults}>Refresh</button>
          </div>
        )}
      </div>

      {/* Candidate Vote Modal */}
      <CandidateVoteModal
        open={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        electionId={id}
        candidates={candidates}
        user={user}
        onVoted={() => {
          setVoteModalOpen(false);
          load();
        }}
      />
    </div>
  );
}
