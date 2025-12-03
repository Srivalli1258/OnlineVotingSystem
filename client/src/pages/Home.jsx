// client/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function easeProgress(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function Home() {
  const nav = useNavigate();

  // counters (kept for future animation)
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
  }, []); // target is constant - safe to omit

  // Steps for "How it works"
  const steps = [
    { id: "s1", title: "Register", desc: "Create your account with your basic details and upload ID proof (Aadhaar / Voter ID).", icon: "📝" },
    { id: "s2", title: "Verify Identity", desc: "We verify your ID and enable voting access once confirmed.", icon: "🔍" },
    { id: "s3", title: "Vote Securely", desc: "When the election opens, cast your encrypted ballot with confidence.", icon: "🔒" },
    { id: "s4", title: "View Results", desc: "See live tallies and final results with transparency.", icon: "📊" },
  ];

  const [smallSearch, setSmallSearch] = useState("");
  const clearSearch = () => setSmallSearch("");

  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("site-theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("site-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("site-theme", "light");
    }
  }, [isDark]);
  const toggleTheme = () => setIsDark((s) => !s);

  const heroImageUrl =
    "https://static.vecteezy.com/system/resources/previews/019/782/103/original/flat-concept-of-online-voting-electronic-voting-internet-voting-system-vector.jpg";

  const howImageUrl =
    "https://media.istockphoto.com/id/1348940066/vector/register-online-to-vote-_-banner.jpg?s=612x612&w=0&k=20&c=PnBwyuwqpO4_0EehjCZqHJym2-wQzTWmMWZtmtFHcPQ=";

  /* ======================
     FAQ data & state
     ====================== */
  const faqList = [
    {
      id: "f1",
      q: "Is this voting system secure?",
      a: "Yes — this frontend demo demonstrates the UI. In a real deployment the system would use end-to-end encryption, identity verification, and audit logs to keep votes secure and auditable."
    },
    {
      id: "f2",
      q: "Do I need to register before voting?",
      a: "Yes. You must register an account and verify your identity (upload required ID proof) before being able to vote in a particular election."
    },
    {
      id: "f3",
      q: "Can I change my vote after submitting?",
      a: "Once the vote is submitted and counted, it cannot be changed. Some systems offer a short 'preview' window; this demo does not implement vote revision."
    },
    {
      id: "f4",
      q: "Where can I see results?",
      a: "Results are shown in the 'View Results' area. This frontend contains placeholders for results — in a working deployment real-time tallies would be served by the backend."
    },
    {
      id: "f5",
      q: "Is my personal information shared?",
      a: "No. Personal information required for identity verification is kept private and used only to confirm voter eligibility. This demo does not send data anywhere."
    },
  ];

  const [faqQuery, setFaqQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null); // id of open faq

  const filteredFaqs = faqList.filter((f) =>
    (f.q + " " + f.a).toLowerCase().includes(faqQuery.trim().toLowerCase())
  );

  function toggleFaq(id) {
    setOpenFaq((prev) => (prev === id ? null : id));
  }

  return (
    <div style={{ padding: "8px 0 28px" }}>
      {/* Announcement + controls */}
      <div style={{ maxWidth: 1100, margin: "8px auto 18px" }}>
        <div
          className="vote-card"
          style={{
            textAlign: "center",
            background: "#fff6f8",
            border: "1px solid #ffeef0",
            fontWeight: 600,
          }}
        >
          📢 General election registration closes on <strong>Dec 10</strong>.
        </div>
      </div>

      <div className="top-announcement-wrap" style={{ marginTop: 0 }}>
        <div className="top-announcement-inner">
          <div className="controls-row">
            <div className="controls-inner">
              <div className="left-controls">
                <button
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-pressed={isDark}
                  title={isDark ? "Switch to light" : "Switch to dark"}
                >
                  {isDark ? "🌙" : "🌞"}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="small-search-group">
                  <input
                    className="small-search"
                    placeholder="Search steps or FAQs..."
                    value={smallSearch}
                    onChange={(e) => setSmallSearch(e.target.value)}
                    aria-label="Search steps or FAQs (frontend only)"
                  />
                  <button className="btn secondary" onClick={clearSearch} type="button">Clear</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="card hero-section" style={{ maxWidth: 1100, margin: "0 auto 18px" }}>
        <div className="hero-left">
          <h1 className="hero-title">Online Voting System</h1>
          <p className="note hero-subtitle" style={{ maxWidth: 520 }}>
            Cast your vote securely from anywhere. No queues, no paper — just transparent, auditable elections.
          </p>

          <div style={{ marginTop: 12 }}>
            <button className="vote-now-btn" onClick={() => nav("/elections")}>Vote Now</button>
          </div>
        </div>

        <div className="hero-image-wrap" aria-hidden>
          <img
            src={heroImageUrl}
            alt="Flat concept of online voting"
            className="hero-image"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f6fb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";
            }}
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>

      {/* FEATURES */}
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

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1100, margin: "18px auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 className="h2" style={{ margin: 0 }}>How it works</h3>
          <div className="note">Simple four-step process</div>
        </div>

        <div className="card how-row" style={{ padding: 20 }}>
          <div className="how-left">
            {steps.map((step) => (
              <div key={step.id} className="step-card">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24 }}>{step.icon}</div>
                  <div style={{ fontWeight: 700 }}>{step.title}</div>
                </div>
                <div className="note" style={{ marginTop: 10 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          <div className="how-right" aria-hidden>
            <img
              src={howImageUrl}
              alt="Register online to vote"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 12,
                boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
              }}
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f6fb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section style={{ maxWidth: 1100, margin: "18px auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 className="h2" style={{ margin: 0 }}>Frequently asked questions</h3>
          <div className="note">Answers about the online voting system (frontend-only)</div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <input
              type="search"
              placeholder="Search FAQs..."
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              className="small-search"
              style={{ flex: "1 1 420px" }}
            />
            <button className="btn secondary" onClick={() => setFaqQuery("")}>Clear</button>
          </div>

          <div className="faq-list">
            {filteredFaqs.length === 0 ? (
              <div className="note">No FAQs match your search.</div>
            ) : (
              filteredFaqs.map((f) => (
                <div
                  key={f.id}
                  className={`faq-item ${openFaq === f.id ? "open" : ""}`}
                  style={{ marginBottom: 10 }}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleFaq(f.id)}
                    aria-expanded={openFaq === f.id}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: "1px solid #eef4ff",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>{f.q}</span>
                    </div>
                    <span style={{ opacity: 0.7 }}>{openFaq === f.id ? "−" : "+"}</span>
                  </button>

                  {openFaq === f.id && (
                    <div className="faq-answer" style={{ padding: "12px 16px", marginTop: 8, borderRadius: 8, background: "var(--card)", border: "1px solid #eef4ff" }}>
                      <div className="note">{f.a}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
