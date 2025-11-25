// client/src/App.jsx
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
      <nav className="app-nav">
        <div className="nav-inner">
          <div className="brand">
            <div className="logo">V</div>
            <div>Heritage Voting</div>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/elections">Elections</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Routes — make sure these page components exist */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          {/* Fallback route */}
          <Route path="*" element={<div style={{padding:40}}><h2>Page not found</h2></div>} />
        </Routes>
      </div>

      <footer className="footer">© {new Date().getFullYear()} Online Voting</footer>
    </div>
  );
}
