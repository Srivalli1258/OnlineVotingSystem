// client/src/pages/AdminViewVotes.jsx
import React, { useEffect, useState, useMemo } from "react";
import adminApi from "../api/adminApi"; // <- If this file is in pages/admin/, change to "../../api/adminApi"
import { saveAs } from "file-saver";

/**
 * AdminViewVotes
 * - Fetches GET /api/admin/votes (adminApi is pre-configured to point to /api/admin)
 * - Displays voterId/name/email, candidate name, election title, and timestamp
 * - Simple search and CSV export
 */

export default function AdminViewVotes() {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        // adminApi.baseURL -> http://.../api/admin
        const res = await adminApi.get("/votes");
        const data = res.data?.votes ?? res.data ?? [];
        if (!cancelled) setVotes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("AdminViewVotes load error:", e);
        if (!cancelled) setErr(e?.response?.data?.message || e.message || "Failed to load votes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // filter results by query (voter name/id/email or candidate name)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return votes;
    return votes.filter((v) => {
      const voterId = typeof v.voterId === "string" ? v.voterId : (v.voterId?._id ?? "");
      const voterName = v.voterId && typeof v.voterId === "object" ? (v.voterId.name ?? "") : "";
      const voterEmail = v.voterId && typeof v.voterId === "object" ? (v.voterId.email ?? "") : "";
      const candidateName = v.candidateId && typeof v.candidateId === "object" ? (v.candidateId.name ?? "") : (typeof v.candidateId === "string" ? v.candidateId : "");
      const electionTitle = v.electionId && typeof v.electionId === "object" ? (v.electionId.title ?? "") : (v.electionId ?? "");
      return [voterId, voterName, voterEmail, candidateName, electionTitle].join(" ").toLowerCase().includes(q);
    });
  }, [votes, query]);

  function downloadCSV() {
    const header = ["voterId", "voterName", "voterEmail", "candidate", "election", "votedAt"];
    const rows = filtered.map((v) => {
      const voterId = typeof v.voterId === "string" ? v.voterId : (v.voterId?._id ?? "");
      const voterName = v.voterId && typeof v.voterId === "object" ? (v.voterId.name ?? "") : "";
      const voterEmail = v.voterId && typeof v.voterId === "object" ? (v.voterId.email ?? "") : "";
      const candidate = v.candidateId && typeof v.candidateId === "object" ? (v.candidateId.name ?? "") : (typeof v.candidateId === "string" ? v.candidateId : "");
      const election = v.electionId && typeof v.electionId === "object" ? (v.electionId.title ?? "") : (v.electionId ?? "");
      const votedAt = v.createdAt ? new Date(v.createdAt).toLocaleString() : "";
      return [voterId, voterName, voterEmail, candidate, election, votedAt];
    });

    const csvLines = [header.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `votes_${new Date().toISOString().slice(0,10)}.csv`);
  }

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>All Cast Votes (Admin)</h2>
            <div className="note">Only visible to administrators. Shows voter id/name and who they voted for.</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="search"
              className="small-search"
              placeholder="Search voter / candidate / election..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <button className="btn secondary" onClick={() => setQuery("")}>Clear</button>
            <button className="btn" onClick={() => setRefreshKey(k => k + 1)}>Refresh</button>
            <button className="btn secondary" onClick={downloadCSV}>Download CSV</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div className="note">Loading votes…</div>
          ) : err ? (
            <div className="alert error">{err}</div>
          ) : filtered.length === 0 ? (
            <div className="note">No votes found{query ? ` for "${query}"` : "."}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="results-table" style={{ width: "100%", minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Voter ID</th>
                    <th>Voter Name</th>
                    <th>Voter Email</th>
                    <th>Candidate</th>
                    <th>Election</th>
                    <th>Voted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => {
                    const voterId = typeof v.voterId === "string" ? v.voterId : (v.voterId?._id ?? "");
                    const voterName = v.voterId && typeof v.voterId === "object" ? (v.voterId.name ?? "") : "";
                    const voterEmail = v.voterId && typeof v.voterId === "object" ? (v.voterId.email ?? "") : "";
                    const candidate = v.candidateId && typeof v.candidateId === "object" ? (v.candidateId.name ?? "") : (typeof v.candidateId === "string" ? v.candidateId : "");
                    const election = v.electionId && typeof v.electionId === "object" ? (v.electionId.title ?? "") : (v.electionId ?? "");
                    const votedAt = v.createdAt ? new Date(v.createdAt).toLocaleString() : "";

                    return (
                      <tr key={v._id || `${voterId}-${i}`} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 6px" }}>{voterId || "N/A"}</td>
                        <td style={{ padding: "8px 6px" }}>{voterName || "Unknown"}</td>
                        <td style={{ padding: "8px 6px" }}>{voterEmail || "—"}</td>
                        <td style={{ padding: "8px 6px", fontWeight: 700 }}>{candidate || "Unknown"}</td>
                        <td style={{ padding: "8px 6px" }}>{election || "—"}</td>
                        <td style={{ padding: "8px 6px" }}>{votedAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
