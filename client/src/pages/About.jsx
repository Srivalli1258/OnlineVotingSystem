// client/src/pages/About.jsx
import React from "react";
import "../index.css"; // correct path from src/pages to src/index.css

const About = () => {
  return (
    <div className="about-wrapper">
      <main className="about-container">

        {/* ====== SECTION 1 – HERO ====== */}
        <section className="about-hero">
          <div className="hero-text">
            <p className="eyebrow">About Us</p>
            <h1>Online Voting System</h1>
            <p className="hero-description">
              Online Voting System is a secure web application that allows
              voters to cast their votes from anywhere, at any time. Our goal
              is to make elections simple, transparent and trustworthy using
              modern technology.
            </p>
          </div>

          <div className="hero-image">
            <img
              src="https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg"
              alt="People collaborating"
              loading="lazy"
            />
          </div>
        </section>

        {/* ====== SECTION 2 – MISSION ====== */}
        <section className="about-row">
          <div className="row-image">
            <img
              src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg"
              alt="People using laptops"
              loading="lazy"
            />
          </div>

          <div className="row-text">
            <h2>Our Mission: Make Voting Accessible & Secure</h2>
            <p>
              We built Online Voting System to reduce long queues, manual
              counting, and paper-based processes. Our platform gives
              organizations a reliable way to conduct elections digitally while
              still maintaining fairness and integrity.
            </p>
          </div>
        </section>

        {/* ====== SECTION 3 – OUR STORY ====== */}
        <section className="about-row reverse">
          <div className="row-text">
            <h2>Our Story</h2>
            <p>
              Online Voting System started as a full-stack development project
              focused on solving a real-world problem – complicated and
              time-consuming traditional voting methods.
            </p>
            <p>
              Step by step, we built a powerful and secure platform that grew
              into a complete digital voting solution trusted by organizations.
            </p>
          </div>

          <div className="row-image">
            <img
              src="https://images.pexels.com/photos/735911/pexels-photo-735911.jpeg"
              alt="Illustration representing growth and success"
              loading="lazy"
            />
          </div>
        </section>

        {/* ====== SECTION 4 – STATS ====== */}
        <section className="about-stats">
          <h2>What Our Platform Delivers</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-number">10+</p>
              <p className="stat-label">Elections Hosted</p>
            </div>

            <div className="stat-card">
              <p className="stat-number">5,000+</p>
              <p className="stat-label">Registered Voters</p>
            </div>

            <div className="stat-card">
              <p className="stat-number">99.9%</p>
              <p className="stat-label">Uptime & Reliability</p>
            </div>

            <div className="stat-card">
              <p className="stat-number">100%</p>
              <p className="stat-label">Secure & Private Votes</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default About;
