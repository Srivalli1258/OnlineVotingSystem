// client/src/pages/Elections.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import adminApi from "../api/adminApi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Elections() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const { user, admin, isAdmin } = useAuth(); // useAuth should expose these

  // choose API client depending on admin status
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, isAdmin]);

  async function load() {
    setLoading(true);
    setError("");
    setList([]);
    try {
      const client = isAdmin ? adminApi : api;
      // both clients call "/elections" relative to their baseURL
      const res = await client.get("/elections");

      let elections = [];
      if (Array.isArray(res.data)) elections = res.data;
      else if (res.data && Array.isArray(res.data.elections)) elections = res.data.elections;
      else if (res.data && (res.data._id || res.data.id)) elections = [res.data];
      else elections = [];

      elections.sort((a, b) => {
        const aDate = new Date(a.startAt || a.date || a.createdAt || 0).getTime();
        const bDate = new Date(b.startAt || b.date || b.createdAt || 0).getTime();
        return bDate - aDate;
      });

      setList(elections);
    } catch (err) {
      console.error("Failed to load elections", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load elections";
      setError(msg);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString();
  }

  const createPath = isAdmin ? "/admin/elections/create" : "/elections/create";

  return (
    <div style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>All elections</h2>
            <div className="note">All elections conducted on this portal.</div>
          </div>

          <div>
            {isAdmin ? (
              <button
                className="btn"
                onClick={() => {
                  navigate(createPath);
                }}
              >
                Create election
              </button>
            ) : (
              <button className="btn secondary" onClick={load}>
                Refresh
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="list">
          {loading && <div className="note">Loading…</div>}
          {error && <div className="message">{error}</div>}

          {!loading && !error && list.length === 0 && (
            <div className="note">
              No elections yet.{" "}
              {isAdmin ? (
                <span>
                  Click <Link to={createPath}>Create election</Link> to add one.
                </span>
              ) : null}
            </div>
          )}

          {!loading &&
            !error &&
            list.map((ev) => (
              <div
                key={ev._id || ev.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 8px",
                  borderBottom: "1px solid rgba(15,23,42,0.03)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                  <div className="note" style={{ marginTop: 6 }}>
                    {ev.description}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="note">{formatDate(ev.startAt || ev.date || ev.createdAt)}</div>
                  <div style={{ marginTop: 8 }}>
                    <Link to={`/elections/${ev._id || ev.id}`} className="btn secondary" style={{ borderRadius: 10 }}>
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
