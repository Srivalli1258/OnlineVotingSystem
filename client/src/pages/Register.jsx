// src/components/RegisterModal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; // your axios instance

export default function RegisterModal() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    idNumber: ""
  });
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function handleFile(e) {
    const f = e.target.files[0];
    setIdFile(f || null);
    if (f && f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setIdPreview(url);
    } else {
      setIdPreview(null);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // validate (all mandatory)
    if (!form.name.trim()) return setError("Full Name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (!form.phone.trim()) return setError("Phone is required");
    if (!form.dob) return setError("Date of birth is required");
    if (!form.gender) return setError("Gender is required");
    if (!form.address.trim()) return setError("Address is required");
    if (!form.idNumber.trim()) return setError("ID Number is required");
    if (!idFile) return setError("Please upload ID proof");

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("idProof", idFile);

      const res = await api.post("/auth/register", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // store token if returned
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user || {}));
      }

      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Registration failed");
    } finally {
      setLoading(false);
      if (idPreview) URL.revokeObjectURL(idPreview);
    }
  }

  // image URL (change to your asset or keep Unsplash fallback)
  const imageUrl = "/assets/register-side.jpg" /* put your local image here */;

  return (
    <div className="rv-page">
      <div className="rv-window">
        <div className="rv-left" style={{ backgroundImage: `url(${imageUrl})` }}>
          <div className="rv-overlay"></div>
          <div className="rv-left-text">
            <h2>Welcome to Heritage Voting</h2>
            <p>Your vote is your voice — register and make it count.</p>
          </div>
        </div>

        <div className="rv-right">
          <div className="rv-form-wrap">
            <h3 className="rv-title">Sign Up</h3>
            <form onSubmit={onSubmit} className="rv-form" encType="multipart/form-data">
              {error && <div className="rv-error">{error}</div>}

              <label className="rv-label">Full Name</label>
              <input className="rv-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} />

              <label className="rv-label">Email</label>
              <input type="email" className="rv-input" value={form.email} onChange={(e) => updateField("email", e.target.value)} />

              <label className="rv-label">Password</label>
              <input type="password" className="rv-input" value={form.password} onChange={(e) => updateField("password", e.target.value)} />

              <label className="rv-label">Confirm Password</label>
              <input type="password" className="rv-input" value={form.confirm} onChange={(e) => updateField("confirm", e.target.value)} />

              <label className="rv-label">Phone Number</label>
              <input className="rv-input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />

              <label className="rv-label">Date of Birth</label>
              <input type="date" className="rv-input" value={form.dob} onChange={(e) => updateField("dob", e.target.value)} />

              <label className="rv-label">Gender</label>
              <select className="rv-input" value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>

              <label className="rv-label">Address</label>
              <textarea className="rv-input rv-textarea" value={form.address} onChange={(e) => updateField("address", e.target.value)} />

              <label className="rv-label">ID Number (Aadhaar/Voter ID)</label>
              <input className="rv-input" value={form.idNumber} onChange={(e) => updateField("idNumber", e.target.value)} />

              <label className="rv-label">Upload ID Proof (PNG/JPG/PDF)</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} />

              {idPreview ? (
                <img src={idPreview} alt="preview" className="rv-id-preview" />
              ) : idFile ? (
                <div className="rv-file-info">{idFile.name}</div>
              ) : null}

              <div className="rv-actions">
                <button type="submit" className="rv-submit" disabled={loading}>
                  {loading ? "Registering..." : "Create account"}
                </button>
              </div>
            </form>

            <div className="rv-note">Already registered? <button className="rv-link" onClick={() => navigate("/login")}>Sign in</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
