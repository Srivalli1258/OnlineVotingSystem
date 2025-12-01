import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Elections from "./pages/Elections";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ElectionDetail from "./pages/ElectionDetail";
import CreateElection from "./pages/CreateElection";
import Navbar from "./components/Navbar";
import About from "./pages/about";
import "./index.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="app">
      <Navbar />

      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* 🔒 Protected Elections Page */}
          <Route
            path="/elections"
            element={
              <ProtectedRoute>
                <Elections />
              </ProtectedRoute>
            }
          />

          {/* 🔒 Protected Election Details */}
          <Route
            path="/elections/:id"
            element={
              <ProtectedRoute>
                <ElectionDetail />
              </ProtectedRoute>
            }
          />

          {/* 🔒 Protect create election too (optional for admin only) */}
          <Route
            path="/elections/create"
            element={
              <ProtectedRoute>
                <CreateElection />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />

          <Route path="*" element={<h2>Page not found</h2>} />
        </Routes>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} VoteX — Make your voice count
      </footer>
    </div>
  );
}
