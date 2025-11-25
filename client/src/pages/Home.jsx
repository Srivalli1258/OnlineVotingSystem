import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const nav = useNavigate();

  // Animated counters
  const [counters, setCounters] = useState({ voters: 0, elections: 0, candidates: 0 });
  const target = { voters: 12456, elections: 42, candidates: 168 };

  // small announcement (could be loaded from API)
  const [announcement] = useState('General election registration closes on Dec 10 — register now!');

  useEffect(() => {
    // simple animation for counters
    let raf = null;
    const duration = 1100;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
      setCounters({
        voters: Math.floor(target.voters * ease),
        elections: Math.floor(target.elections * ease),
        candidates: Math.floor(target.candidates * ease),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, []); // run once on mount

  // sample "recent elections" placeholder
  const recentElections = [
    { id: 1, title: 'Student Council 2025', desc: 'Campus-wide student leader election', date: '2025-11-20' },
    { id: 2, title: 'City Council By-Election', desc: 'Ward 9 seat by-election', date: '2025-10-05' },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Announcement */}
      <div style={{ maxWidth: 920, margin: '8px auto 20px', display: 'flex', justifyContent: 'center' }}>
        <div className="vote-card" style={{ maxWidth: 920 }}>
          <strong style={{ marginRight: 10 }}>📢</strong>
          <span className="note">{announcement}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="card" style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 420px', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Make your voice count — vote.</h1>
          <p className="note" style={{ marginTop: 8 }}>
            Online Voting — register, create elections, add candidates, and cast your vote securely.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <button className="btn" onClick={() => nav('/register')}>Create account</button>
            <Link to="/elections" className="btn secondary" style={{ textDecoration: 'none', padding: '10px 14px', display: 'inline-flex', alignItems: 'center' }}>
              View elections
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <div style={{ minWidth: 0 }}>
              <div className="h2" style={{ marginBottom: 6 }}>Why voting matters</div>
              <p className="note" style={{ margin: 0 }}>
                Voting shapes leadership, influences policies, and ensures every voice is heard. Small steps lead to big change.
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {/* Quick stats (ONLY stats now — quick actions removed) */}
<aside style={{ display: 'grid', gap: 12 }}>
  <div className="vote-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div className="note">Voters</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.voters.toLocaleString()}</div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div className="note">Elections</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.elections}</div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div className="note">Candidates</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.candidates}</div>
    </div>
  </div>
</aside>

      </section>

      {/* Features / Why vote */}
      <section style={{ maxWidth: 920, margin: '18px auto', display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>✅ Secure</div>
            <p className="note" style={{ marginTop: 8 }}>End-to-end integrity and role-based access keep votes protected.</p>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>⚡ Fast</div>
            <p className="note" style={{ marginTop: 8 }}>Create elections and tally results quickly — no manual counting.</p>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>🌍 Inclusive</div>
            <p className="note" style={{ marginTop: 8 }}>Accessible interface so more people can take part in decision making.</p>
          </div>
        </div>

        {/* 4 step process */}
        <div className="card" style={{ padding: 14 }}>
          <div className="h2">How voting works</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>1. Register</div>
              <div className="note">Create an account and verify your email.</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>2. Find election</div>
              <div className="note">Browse elections relevant to you.</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>3. Vote</div>
              <div className="note">Select your candidate and submit — votes are recorded securely.</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>4. Results</div>
              <div className="note">Results are tallied and published automatically.</div>
            </div>
          </div>
        </div>

        {/* Recent elections (placeholder) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="h2">Recent elections</div>
            <Link to="/elections" style={{ color: 'var(--accent-600)', fontWeight: 700 }}>See all</Link>
          </div>

          <div style={{ marginTop: 12 }} className="list">
            {recentElections.map(ev => (
              <Link key={ev.id} to={`/elections/${ev.id}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ev.title}</div>
                    <div className="note" style={{ marginTop: 6 }}>{ev.desc}</div>
                  </div>
                  <div style={{ marginLeft: 12 }}>
                    <div className="note">{ev.date}</div>
                    <div style={{ marginTop: 6 }}>
                      <button className="btn secondary" onClick={(e)=>{ e.preventDefault(); nav(`/elections/${ev.id}`); }}>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ maxWidth: 920, margin: '28px auto', textAlign: 'center' }} className="note">
        <div>© {new Date().getFullYear()} Heritage Voting — Make your voice count</div>
      </footer>
    </div>
  );
}
