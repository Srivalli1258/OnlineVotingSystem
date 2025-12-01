// server/src/controllers/voteController.js
import mongoose from "mongoose";
import AllowedVoter from "../models/AllowedVoter.js";
import Vote from "../models/Vote.js";
import Election from "../models/Election.js"; // adjust if your model filename differs

/**
 * castVote
 * - Accepts: POST /elections/:id/vote
 * - Body: { candidateId, voterId, pin }
 *
 * Behavior:
 * 1. Validate input
 * 2. Ensure election exists and is open
 * 3. Verify voterId exists in AllowedVoter and pin matches
 * 4. Ensure voter hasn't already voted
 * 5. Create Vote document and mark AllowedVoter.voted = true (transaction)
 */
export async function castVote(req, res) {
  try {
    const electionId = req.params.id;
    const { candidateId, voterId, pin } = req.body;

    if (!candidateId || !voterId || !pin) {
      return res.status(400).json({ message: "candidateId, voterId and pin are required" });
    }

    // load election and check open/closed
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: "Election not found" });

    const now = new Date();
    if (election.startAt && now < new Date(election.startAt)) {
      return res.status(400).json({ message: "Election has not started" });
    }
    if (election.endAt && now > new Date(election.endAt)) {
      return res.status(400).json({ message: "Election is closed" });
    }

    // find allowed voter
    const normalizedVoterId = String(voterId).trim();
    const allowed = await AllowedVoter.findOne({ voterId: normalizedVoterId });
    if (!allowed) return res.status(400).json({ message: "Invalid voterId or pin" });

    // plain-text pin compare (development). If you hashed pins, replace with bcrypt.compare
    if (String(allowed.pin).trim() !== String(pin).trim()) {
      return res.status(400).json({ message: "Invalid voterId or pin" });
    }

    if (allowed.voted) {
      return res.status(400).json({ message: "This voter has already voted" });
    }

    // use transaction if available (requires replica set). Fallback to non-transactional operations if not.
    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      // create vote
      await Vote.create([{
        electionId: election._id,
        candidateId,
        voterId: allowed.voterId,
        createdAt: new Date()
      }], { session });

      // mark allowed voter as voted
      allowed.voted = true;
      allowed.votedAt = new Date();
      await allowed.save({ session });

      await session.commitTransaction();
      session.endSession();
    } catch (txErr) {
      if (session) {
        try { await session.abortTransaction(); session.endSession(); } catch (e) {}
      }
      // If transaction fails due to replica set missing, attempt fallback (best-effort)
      if (txErr.message && txErr.message.match(/transactions are not supported/)) {
        // fallback: create vote then update allowed voter
        await Vote.create({
          electionId: election._id,
          candidateId,
          voterId: allowed.voterId,
          createdAt: new Date()
        });
        allowed.voted = true;
        allowed.votedAt = new Date();
        await allowed.save();
      } else {
        console.error("Transaction error in castVote:", txErr);
        return res.status(500).json({ message: "Server error during vote" });
      }
    }

    return res.json({ message: "Vote recorded" });
  } catch (err) {
    console.error("castVote error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// optionally export same function under another name if other code imports it
export { castVote as castVoteWithVoterPin };
