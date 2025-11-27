// client/src/components/ParticipateForm.jsx
import React, { useState } from "react";
import api from "../api/axios";

export default function ParticipateForm({ electionId, onRegistered }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [party, setParty] = useState("");
  const [symbol, setSymbol] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [schemes, setSchemes] = useState([]);
  const [schemeInput, setSchemeInput] = useState("");

  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function addScheme() {
    if (!schemeInput.trim()) return;
    setSchemes([...schemes, schemeInput.trim()]);
    setSchemeInput("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post(`/elections/${electionId}/candidates`, {
        name,
        age,
        party,
        symbol,
        manifesto,
        schemes,
        description,
      });

      setMessage("Candidate registered successfully!");

      if (onRegistered) onRegistered(res.data?.candidate);

    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Participate as Candidate</h3>

      {error && <div className="message error">{error}</div>}
      {message && <div className="message success">{message}</div>}

      <form onSubmit={handleSubmit}>

        <label>Name</label>
        <input type="text" className="input"
          value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Age</label>
        <input type="number" className="input"
          value={age} onChange={(e) => setAge(e.target.value)} required min="18" />

        <label>Party</label>
        <input type="text" className="input"
          value={party} onChange={(e) => setParty(e.target.value)} required />

        <label>Symbol (Image URL)</label>
        <input type="text" className="input"
          value={symbol} onChange={(e) => setSymbol(e.target.value)} />

        <label>Manifesto</label>
        <textarea className="input"
          value={manifesto} onChange={(e) => setManifesto(e.target.value)} required />

        <label>Description / Bio</label>
        <textarea className="input"
          value={description} onChange={(e) => setDescription(e.target.value)} />

        <label>Schemes</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            className="input"
            value={schemeInput}
            onChange={(e) => setSchemeInput(e.target.value)}
          />
          <button type="button" className="btn secondary" onClick={addScheme}>
            Add
          </button>
        </div>

        {schemes.length > 0 && (
          <ul className="note" style={{ marginTop: 6 }}>
            {schemes.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        )}

        <button
          className="btn"
          type="submit"
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading ? "Submitting…" : "Submit Candidate Details"}
        </button>
      </form>
    </div>
  );
}
