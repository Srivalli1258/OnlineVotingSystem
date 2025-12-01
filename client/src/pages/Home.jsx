// client/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function easeProgress(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function Home() {
  const nav = useNavigate();

  // counters (kept for possible future use)
  const [counters, setCounters] = useState({ voters: 0, elections: 0, candidates: 0 });
  const target = { voters: 12456, elections: 42, candidates: 168 };

  useEffect(() => {
    let raf = null;
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const e = easeProgress(t);
      setCounters({
        voters: Math.floor(target.voters * e),
        elections: Math.floor(target.elections * e),
        candidates: Math.floor(target.candidates * e),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, []);

  // Steps for "How it works"
  const steps = [
    {
      id: "s1",
      title: "Register",
      desc: "Create your account with your basic details and upload ID proof (Aadhaar / Voter ID).",
      icon: "📝"
    },
    {
      id: "s2",
      title: "Verify Identity",
      desc: "We verify your ID and enable voting access once confirmed.",
      icon: "🔍"
    },
    {
      id: "s3",
      title: "Vote Securely",
      desc: "When the election opens, cast your encrypted ballot with confidence.",
      icon: "🔒"
    },
    {
      id: "s4",
      title: "View Results",
      desc: "See live tallies and final results with transparency.",
      icon: "📊"
    }
  ];

  return (
    <div style={{ padding: "8px 0 28px" }}>
      {/* Announcement */}
      <div style={{ maxWidth: 1100, margin: "8px auto 18px" }}>
        <div
          className="vote-card"
          style={{
            textAlign: "center",
            background: "#fff6f8",
            border: "1px solid #ffeef0",
            fontWeight: 600
          }}
        >
          📢 General election registration closes on <strong>Dec 10</strong>.
        </div>
      </div>

      {/* Hero */}
      <section className="card hero-section" style={{ maxWidth: 1100, margin: "0 auto 18px" }}>
        <div className="hero-left">
          <h1 className="hero-title">Online Voting System</h1>
          <p className="note hero-subtitle" style={{ maxWidth: 520 }}>
            Cast your vote securely from anywhere. No queues, no paper — just transparent, auditable elections.
          </p>
        </div>

        <div className="hero-image-wrap" aria-hidden>
          <img
            src="https://images.pexels.com/photos/1181297/pexels-photo-1181297.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=900"
            alt="Voting illustration"
            className="hero-image"
            loading="lazy"
          />
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: "18px auto" }}>
        <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>🔒 Secure Voting</div>
            <p className="note" style={{ marginTop: 8 }}>Your vote is encrypted end-to-end.</p>
          </div>

          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>⚡ Instant Counting</div>
            <p className="note" style={{ marginTop: 8 }}>Results processed in real-time.</p>
          </div>

          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>📁 Full Transparency</div>
            <p className="note" style={{ marginTop: 8 }}>Complete audit logs for every election.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ maxWidth: 1100, margin: "18px auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 className="h2" style={{ margin: 0 }}>How it works</h3>
          <div className="note">Simple four-step process</div>
        </div>

        <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {steps.map(step => (
            <div key={step.id} style={{ padding: 14, borderRadius: 10, border: "1px solid #eef4ff", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 26 }}>{step.icon}</div>
                <div style={{ fontWeight: 700 }}>{step.title}</div>
              </div>
              <div className="note" style={{ flex: 1 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
