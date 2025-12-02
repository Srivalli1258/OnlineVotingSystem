// server/src/routes/adminPanel.js
import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import Election from '../models/Election.js'; // make sure this file exists

const router = express.Router();

// Protect all admin-panel routes
router.use(adminAuth);

// Simple dashboard (you already had this)
router.get("/dashboard", (req, res) => {
  return res.json({
    message: `Hello ${req.admin.employeeId}`,
    admin: req.admin
  });
});

// GET /elections  -> /api/admin/elections
router.get("/elections", async (req, res) => {
  try {
    const list = await Election.find().lean();
    return res.json(list);
  } catch (err) {
    console.error("adminPanel GET /elections error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------- ADDED: POST /elections ----------
router.post("/elections", async (req, res) => {
  try {
    const { title, description, startAt, endAt, candidateEligibility, eligibility } = req.body || {};

    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ message: "Title is required" });
    }

    const election = new Election({
      title: String(title).trim(),
      description: description ? String(description) : "",
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      candidateEligibility: candidateEligibility ? String(candidateEligibility) : "",
      eligibility: eligibility ? String(eligibility) : ""
    });

    await election.save();

    return res.status(201).json({ election });
  } catch (err) {
    console.error("adminPanel POST /elections error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
// ---------- end added route ----------

// GET /elections/:id -> /api/admin/elections/:id
router.get("/elections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Election.findById(id).lean();
    if (!ev) return res.status(404).json({ message: "Election not found" });
    return res.json(ev);
  } catch (err) {
    console.error("adminPanel GET /elections/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
