// server/src/routes/adminRoutes.js
import express from "express";
import mongoose from "mongoose";
import { adminAuth } from "../middleware/adminAuth.js"; // <-- named import (was default before)
import Vote from "../models/Vote.js";
import Candidate from "../models/Candidate.js";

const router = express.Router();

/**
 * GET /api/admin/votes
 * Admin-only: return all votes (latest first) with voter & candidate populated.
 */
router.get("/votes", adminAuth, async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate("voterId", "_id name email")
      .populate("candidateId", "_id name party")
      .populate("electionId", "_id title")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, total: votes.length, votes });
  } catch (err) {
    console.error("GET /api/admin/votes error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch votes" });
  }
});

/**
 * GET /api/admin/elections/:id/results
 * Admin-only: return detailed votes for a single election + aggregated counts
 */
router.get("/elections/:id/results", adminAuth, async (req, res) => {
  try {
    const electionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ success: false, message: "Invalid election id" });
    }

    // 1) Detailed votes
    const votes = await Vote.find({ electionId })
      .populate("voterId", "_id name email")
      .populate("candidateId", "_id name party")
      .sort({ createdAt: -1 })
      .lean();

    // 2) Aggregated counts per candidate
    const countsAgg = await Vote.aggregate([
      { $match: { electionId: mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: "$candidateId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          candidateId: "$_id",
          count: 1,
          candidateName: "$candidate.name",
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.json({ success: true, votes, counts: countsAgg });
  } catch (err) {
    console.error("GET /api/admin/elections/:id/results error:", err);
    return res.status(500).json({ success: false, message: "Failed to load election results" });
  }
});

export default router;
