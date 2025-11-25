import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Elections() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/elections');
      const elections = Array.isArray(res.data) ? res.data : (res.data?.elections || []);
      elections.sort((a,b) => new Date(b.startAt || b.date || b.createdAt) - new Date(a.startAt || a.date || a.createdAt));
      setList(elections);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load elections');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d); if (isNaN(dt)) return d; return dt.toISOString().slice(0,10);
  }

  return (
    <div style={{ padding: 20, maxWidth: 980, margin: '0 auto' }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ margin:0 }}>All elections</h2>
            <div className="note">All elections conducted on this portal.</div>
          </div>
          <div>
            {user?.role === 'admin'
              ? <Link to="/elections/create" className="btn">Create election</Link>
              : <button className="btn secondary" onClick={load}>Refresh</button>
            }
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="list">
          {loading && <div className="note">Loading…</div>}
          {error && <div className="message">{error}</div>}
          {!loading && !error && list.map(ev => (
            <div key={ev._id} style={{ display:'flex', justifyContent:'space-between', padding:'12px 8px', borderBottom:'1px solid rgba(15,23,42,0.03)' }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700 }}>{ev.title}</div>
                <div className="note" style={{ marginTop:6 }}>{ev.description}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="note">{formatDate(ev.startAt || ev.date)}</div>
                <div style={{ marginTop:8 }}>
                  <Link to={`/elections/${ev._id}`} className="btn secondary" style={{ borderRadius:10 }}>View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
