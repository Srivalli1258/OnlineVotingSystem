// client/src/components/CandidateVoteModal.jsx
import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function CandidateVoteModal({ open, onClose, electionId, candidates = [], onVoted }) {
  const [voterId, setVoterId] = useState("");
  const [pin, setPin] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setVoterId("");
      setPin("");
      setSelected(null);
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    setError("");
    if (!selected) return setError("Please select a candidate.");
    if (!voterId.trim()) return setError("Voter ID is required.");
    if (!/^\d{4}$/.test(pin)) return setError("PIN must be 4 digits.");

    setLoading(true);
    try {
      await api.post(`/elections/${electionId}/vote`, {
        candidateId: selected._id || selected.id,
        voterId: voterId.trim(),
        pin: pin.trim()
      });
      setLoading(false);
      onVoted && onVoted();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || "Failed to cast vote");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4000 }}>
      <div style={{ width: 820, maxWidth: "96%", background: "#fff", borderRadius: 10, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Vote — verify Voter ID & PIN</h3>
          <div>
            <button className="btn secondary" onClick={onClose}>Close</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="note">Voter ID</label>
            <input className="field" value={voterId} onChange={(e) => setVoterId(e.target.value)} placeholder="E.g. VOTER0001" />
          </div>
          <div style={{ width: 240 }}>
            <label className="note">4-digit PIN</label>
            <input className="field" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} placeholder="1234" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, marginTop: 12 }}>
          <div style={{ border: "1px solid #eef4ff", padding: 12, borderRadius: 8, maxHeight: 340, overflow: "auto" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Select candidate</div>
            {candidates.length === 0 && <div className="note">No candidates available</div>}
            {candidates.map(c => (
              <div key={c._id || c.id} onClick={() => setSelected(c)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10,
                borderRadius: 8, marginBottom: 8, cursor: "pointer",
                border: (selected && (selected._id || selected.id) === (c._id || c.id)) ? "1px solid #0b4a7a" : "1px solid #eef4ff"
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div className="note">{c.manifesto || c.description}</div>
                </div>
                <div>
                  {(selected && (selected._id || selected.id) === (c._id || c.id)) ? <span className="note">Selected</span> : <button className="btn" onClick={(e)=>{ e.stopPropagation(); setSelected(c); }}>Choose</button>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #eef4ff", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Confirm & submit</div>
            <div className="note" style={{ marginBottom: 12 }}>After PIN verification, the vote will be recorded and this voter will be blocked from voting again.</div>
            {error && <div className="alert error">{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={handleSubmit} disabled={loading}>{loading ? "Submitting…" : "Submit vote"}</button>
              <button className="btn secondary" onClick={onClose} disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
