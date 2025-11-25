import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Elections from './pages/Elections';
import Login from './pages/Login';
import Register from './pages/Register';
import ElectionDetail from './pages/ElectionDetail';
import './index.css';

export default function App() {
  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="app-nav">
        <div className="nav-inner">
          {/* Left: logo + brand */}
          <div className="brand">
            <div className="brand-logo">V</div>
            <div className="brand-text">
              <div className="brand-title">VoteX</div>
              <div className="brand-subtitle">Online Voting System</div>
            </div>
          </div>

          {/* Center: links like first image */}
          <div className="nav-center">
            <Link to="/">Home</Link>
            <a href="#about">About</a>
            <a href="elections">Elections</a>
            <a href="#contact">Contact</a>
          </div>

          {/* Right: Login / Register buttons */}
          <div className="nav-auth">
            <Link to="/login" className="btn nav-login">
              Login
            </Link>
            <Link to="/register" className="btn nav-register">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          <Route
            path="*"
            element={
              <div style={{ padding: 40 }}>
                <h2>Page not found</h2>
              </div>
            }
          />
        </Routes>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} Online Voting
      </footer>
    </div>
  );
}