import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const nav = useNavigate();

  const [counters, setCounters] = useState({
    voters: 0,
    elections: 0,
    candidates: 0,
  });
  const target = { voters: 12456, elections: 42, candidates: 168 };
  const [announcement] = useState('General election registration closes on Dec 10 — register now!');

  useEffect(() => {
    let raf = null;
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setCounters({
        voters: Math.floor(target.voters * ease),
        elections: Math.floor(target.elections * ease),
        candidates: Math.floor(target.candidates * ease),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ padding: '8px 0 20px' }}>
      <div style={{ maxWidth: 1100, margin: '4px auto 18px' }}>
        <div className="vote-card" style={{ textAlign: 'center', background: '#fff6f8', border: '1px solid #ffeef0' }}>
          📢 {announcement}
        </div>
      </div>

      <section className="card hero-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="hero-left">
          <h1 className="hero-title">Online Voting System</h1>
          <p className="note hero-subtitle">
            Cast your vote securely from anywhere. Make your voice heard in just a few clicks.
          </p>

          <button className="vote-now-btn" onClick={() => nav('/elections')}>Vote Now</button>
        </div>

        <div className="hero-image-wrap">
          <img
            src="https://storage.googleapis.com/fplswordpressblog/2022/07/online-voting.png"
            alt="Online Voting"
            className="hero-image"
          />
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '18px auto 0' }}>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>🔒 Secure Voting</div>
            <p className="note" style={{ marginTop: 8 }}>Advanced protection ensures vote confidentiality.</p>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>📊 Real-time Results</div>
            <p className="note" style={{ marginTop: 8 }}>Live updates as votes are counted.</p>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>🕒 Easy Registration</div>
            <p className="note" style={{ marginTop: 8 }}>Register and vote quickly.</p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '18px auto 0' }}>
        <div className="card">
          <div className="h2" style={{ textAlign: 'center' }}>How It Works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
            <div><strong style={{ fontSize: 16 }}>Register</strong><div className="note">Create your account</div></div>
            <div><strong style={{ fontSize: 16 }}>Verify</strong><div className="note">Confirm eligibility</div></div>
            <div><strong style={{ fontSize: 16 }}>Vote</strong><div className="note">Cast your secure vote</div></div>
            <div><strong style={{ fontSize: 16 }}>Results</strong><div className="note">View election results</div></div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '12px auto 0' }}>
        <div className="vote-card stats">
          <div>
            <div className="note">Voters</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.voters.toLocaleString()}</div>
          </div>
          <div>
            <div className="note">Elections</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.elections}</div>
          </div>
          <div>
            <div className="note">Candidates</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{counters.candidates}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
