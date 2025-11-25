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

  const [announcement] = useState(
    'General election registration closes on Dec 10 — register now!'
  );

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
    <div style={{ padding: '8px 20px 20px' }}>
      {/* Announcement */}
      <div style={{ maxWidth: 920, margin: '4px auto 18px' }}>
        <div className="vote-card" style={{ textAlign: 'center' }}>
          📢 {announcement}
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="card hero-section">
        {/* Left content */}
        <div className="hero-left">
          <h1 className="hero-title">Online Voting System</h1>
          <p className="note hero-subtitle">
            Cast your vote securely from anywhere. Make your voice heard in just a few clicks.
          </p>

          <button
            className="vote-now-btn"
            style={{ marginTop: 20 }}
            onClick={() => nav('/elections')}
          >
            Vote Now
          </button>
        </div>

        {/* Right image using your URL */}
        <div className="hero-image-wrap">
          <img
            src="https://storage.googleapis.com/fplswordpressblog/2022/07/online-voting.png"
            alt="Online Voting"
            className="hero-image"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 920, margin: '18px auto 0' }}>
        <div
          className="card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>🔒 Secure Voting</div>
            <p className="note" style={{ marginTop: 8 }}>
              Advanced protection ensures the integrity and confidentiality of your vote.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>📊 Real-time Results</div>
            <p className="note" style={{ marginTop: 8 }}>
              Track live election results as votes are counted instantly.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>🕒 Easy Registration</div>
            <p className="note" style={{ marginTop: 8 }}>
              Quick registration to get started in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 920, margin: '12px auto 0' }}>
        <div className="card">
          <div className="h2">How It Works</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <strong>Register</strong>
              <div className="note">Create your account</div>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <strong>Verify</strong>
              <div className="note">Confirm eligibility</div>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <strong>Vote</strong>
              <div className="note">Cast your secure vote</div>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <strong>Results</strong>
              <div className="note">View Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ maxWidth: 920, margin: '12px auto 0' }}>
        <div
          className="vote-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 16,
          }}
        >
          <div>
            <div className="note">Voters</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {counters.voters.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="note">Elections</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {counters.elections}
            </div>
          </div>
          <div>
            <div className="note">Candidates</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {counters.candidates}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ maxWidth: 920, margin: '28px auto', textAlign: 'center' }} className="note">
        © {new Date().getFullYear()} VoteX — Make your voice count
      </footer>
    </div>
  );
}