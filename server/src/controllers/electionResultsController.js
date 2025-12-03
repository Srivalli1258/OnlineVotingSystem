// server/src/controllers/electionResultsController.js
import mongoose from "mongoose";
import Vote from "../models/Vote.js";
import Candidate from "../models/Candidate.js";

/**
 * GET /api/elections/:id/results
 * Admin-only.
 *
 * Response:
 * {
 *   success: true,
 *   votes: [ { voterId: {_id, name, email}, candidateId: {_id, name, party}, createdAt }, ... ],
 *   counts: [ { candidateId, candidateName, count }, ... ]
 * }
 */
export async function getElectionResultsDetailed(req, res) {
  try {
    const electionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ success: false, message: "Invalid election id" });
    }

    // 1) Detailed votes (latest first)
    const votes = await Vote.find({ electionId: electionId })
      .populate("voterId", "_id name email")       // only expose necessary voter fields
      .populate("candidateId", "_id name party")   // candidate info
      .sort({ createdAt: -1 })
      .lean();

    // 2) Aggregated counts per candidate (candidateId -> count)
    // Use aggregation so we can return candidate names alongside counts
    const countsAgg = await Vote.aggregate([
      { $match: { electionId: mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: "$candidateId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "candidates",               // collection name (ensure matches your DB)
          localField: "_id",
          foreignField: "_id",
          as: "candidate"
        }
      },
      { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          candidateId: "$_id",
          count: 1,
          candidateName: "$candidate.name"
        }
      },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      success: true,
      votes,
      counts: countsAgg
    });
  } catch (err) {
    console.error("getElectionResultsDetailed error:", err);
    return res.status(500).json({ success: false, message: "Failed to load results" });
  }
}
