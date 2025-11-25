// client/src/pages/Elections.jsx
import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Elections() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const location = useLocation(); // used to reload when navigation happens

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]); // reload whenever navigation key changes (e.g., after create -> navigate)

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/elections');

      // Accept multiple response shapes:
      // 1) Array (res.data = [ ... ])
      // 2) Object with elections property (res.data = { elections: [...] })
      // 3) Object with single election (res.data = { ...single election... }) -> wrap it
      let elections = [];
      if (Array.isArray(res.data)) {
        elections = res.data;
      } else if (res.data && Array.isArray(res.data.elections)) {
        elections = res.data.elections;
      } else if (res.data && (res.data._id || res.data.id)) {
        // single election returned (wrap into array)
        elections = [res.data];
      } else {
        elections = [];
      }

      // sort newest first using startAt / date / createdAt
      elections.sort((a, b) => {
        const aDate = new Date(a.startAt || a.date || a.createdAt || 0).getTime();
        const bDate = new Date(b.startAt || b.date || b.createdAt || 0).getTime();
        return bDate - aDate;
      });

      setList(elections);
    } catch (err) {
      console.error('Failed to load elections', err);
      setError(err?.response?.data?.message || 'Failed to load elections');
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    // show readable date
    return dt.toLocaleDateString();
  }

  return (
    <div style={{ padding: 20, maxWidth: 980, margin: '0 auto' }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>All elections</h2>
            <div className="note">All elections conducted on this portal.</div>
          </div>
          <div>
            {user?.role === 'admin' ? (
              <Link to="/elections/create" className="btn">Create election</Link>
            ) : (
              <button className="btn secondary" onClick={load}>Refresh</button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="list">
          {loading && <div className="note">Loading…</div>}
          {error && <div className="message">{error}</div>}

          {!loading && !error && list.length === 0 && (
            <div className="note">No elections yet. {user?.role === 'admin' && <span>Click <Link to="/elections/create">Create election</Link> to add one.</span>}</div>
          )}

          {!loading && !error && list.map(ev => (
            <div
              key={ev._id || ev.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 8px',
                borderBottom: '1px solid rgba(15,23,42,0.03)'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{ev.title}</div>
                <div className="note" style={{ marginTop: 6 }}>{ev.description}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="note">{formatDate(ev.startAt || ev.date || ev.createdAt)}</div>
                <div style={{ marginTop: 8 }}>
                  <Link to={`/elections/${ev._id || ev.id}`} className="btn secondary" style={{ borderRadius: 10 }}>View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
