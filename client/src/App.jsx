// client/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Elections from "./pages/Elections";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ElectionDetail from "./pages/ElectionDetail";
import CreateElection from "./pages/CreateElection";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import "./index.css";
import Contact from "./pages/Contact";

import useAuth from "./hooks/useAuth";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminLayout from "./layouts/AdminLayout";

// allow admin OR voter token
function ProtectedVoterRoute({ children }) {
  const voterToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  // if neither token present -> redirect to login
  if (!voterToken && !adminToken) {
    return <Navigate to="/login" replace />;
  }

  // otherwise allow (admin will be able to view /elections too)
  return children;
}


export default function App() {
  const { isAdmin } = useAuth();

  return (
    <div className="app">
      <Navbar />

      <div className="container">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Login: if admin already logged in, send to /admin/elections */}
          <Route path="/login" element={<Login />} />

          {/* Voter protected routes */}
          <Route path="/elections" element={<ProtectedVoterRoute><Elections /></ProtectedVoterRoute>} />
          <Route path="/elections/:id" element={<ProtectedVoterRoute><ElectionDetail /></ProtectedVoterRoute>} />
          <Route path="/elections/create" element={<ProtectedVoterRoute><CreateElection /></ProtectedVoterRoute>} />

          {/* Admin routes (router is in index.jsx, so just define nested routes here) */}
          <Route path="/admin" element={<ProtectedAdminRoute />}>
            <Route index element={<Navigate to="elections" replace />} />
            <Route path="elections" element={<AdminLayout><Elections /></AdminLayout>} />
            <Route path="elections/create" element={<AdminLayout><CreateElection /></AdminLayout>} />
          </Route>

          <Route path="/register" element={<Register />} />
          <Route path="*" element={<h2>Page not found</h2>} />
        </Routes>
      </div>
    </div>
  );
}
