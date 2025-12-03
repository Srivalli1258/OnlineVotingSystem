// server/src/controllers/voteController.js
import mongoose from "mongoose";
import AllowedVoter from "../models/AllowedVoter.js";
import Vote from "../models/Vote.js";
import Election from "../models/Election.js";
import Candidate from "../models/Candidate.js";
import User from "../models/User.js";

/**
 * castVote
 * POST /elections/:id/vote
 * Body: { candidateId, voterId, pin }
 */
export async function castVote(req, res) {
  try {
    const electionId = req.params.id;
    const { candidateId, voterId, pin } = req.body || {};

    console.log("CASTVOTE: body=", req.body);
    console.log("CASTVOTE: params -> electionId:", electionId, "candidateId:", candidateId);

    if (!electionId) return res.status(400).json({ message: "Election id required" });
    if (!candidateId || !voterId || (pin === undefined || pin === null)) {
      return res.status(400).json({ message: "candidateId, voterId and pin are required" });
    }

    // ensure election exists & open
    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ message: "Election not found" });
    const now = new Date();
    if (election.startAt && new Date(election.startAt) > now) return res.status(400).json({ message: "Election has not started" });
    if (election.endAt && new Date(election.endAt) < now) return res.status(400).json({ message: "Election is closed" });

    // verify candidate belongs to election (best-effort)
    if (Array.isArray(election.candidates) && election.candidates.length > 0) {
      const found = election.candidates.find(c => String(c) === String(candidateId) || String(c?._id) === String(candidateId));
      if (!found) return res.status(400).json({ message: "Candidate not part of this election" });
    } else {
      const candExists = await Candidate.findById(candidateId).lean();
      if (!candExists) return res.status(400).json({ message: "Candidate not found" });
    }

    // normalize input
    const normalizedVoterId = String(voterId).trim();
    const canonicalVoterId = normalizedVoterId.toUpperCase();
    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

    const db = mongoose.connection.db;

    // 1) Try Mongoose AllowedVoter model lookup (case-insensitive)
    let allowed = null;
    try {
      const re = new RegExp(`^${escapeRegex(normalizedVoterId)}$`, "i");
      allowed = await AllowedVoter.findOne({ voterId: re }).exec();
      console.log("CASTVOTE: AllowedVoter model lookup success:", !!allowed);
    } catch (mErr) {
      console.warn("CASTVOTE: AllowedVoter model lookup error:", mErr && mErr.message);
      allowed = null;
    }

    // 2) Raw DB fallback (if allowed not found)
    if (!allowed) {
      try {
        const cols = await db.listCollections().toArray();
        const colNames = cols.map(c => c.name);
        const candidateNames = ["allowedvoters", "allowedVoters", "allowed_voters", "allowed_voter", "allowedvoter"];
        const foundName = candidateNames.find(n => colNames.includes(n));
        const detectedCollName = foundName || colNames.find(n => n.toLowerCase().includes("allowed")) || "allowedvoters";
        const rawColl = db.collection(detectedCollName);

        // exact-field attempts
        const fieldQueries = [
          { voterId: normalizedVoterId },
          { voterID: normalizedVoterId },
          { voterid: normalizedVoterId },
          { voterId: canonicalVoterId },
          { voterID: canonicalVoterId },
        ];

        let rawDoc = null;
        for (const q of fieldQueries) {
          try { rawDoc = await rawColl.findOne(q); if (rawDoc) break; } catch (qErr) {}
        }

        if (!rawDoc) {
          const escaped = escapeRegex(normalizedVoterId);
          rawDoc =
            (await rawColl.findOne({ voterId: { $regex: `^${escaped}$`, $options: "i" } })) ||
            (await rawColl.findOne({ voterID: { $regex: `^${escaped}$`, $options: "i" } }));
        }

        if (!rawDoc) {
          // limited fallback scan (avoid huge scans)
          try {
            const docs = await rawColl.find().limit(1000).toArray();
            const targetUpper = normalizedVoterId.toUpperCase();
            for (const doc of docs) {
              for (const k of Object.keys(doc)) {
                const v = doc[k];
                if (typeof v === "string" && v.trim().toUpperCase() === targetUpper) {
                  rawDoc = doc;
                  break;
                }
              }
              if (rawDoc) break;
            }
          } catch (scanErr) { console.warn("CASTVOTE: fallback-scan error:", scanErr && scanErr.message); }
        }

        if (rawDoc) {
          rawDoc._isRaw = true;
          rawDoc._rawCollectionName = detectedCollName;
          allowed = rawDoc;
          console.log("CASTVOTE: raw allowed voter found:", rawDoc._id || rawDoc.voterId || rawDoc.voterID);
        } else {
          console.log("CASTVOTE: raw lookup found no matching voter");
        }
      } catch (rawErr) {
        console.error("CASTVOTE: raw lookup error:", rawErr && (rawErr.stack || rawErr.message || rawErr));
      }
    }

    if (!allowed) {
      console.log("CASTVOTE: voter not found for", normalizedVoterId);
      return res.status(400).json({ message: "voter not found" });
    }

    // Safely resolve a User ObjectId if possible:
    let voterObjectId = null;
    const possibleObjectFields = ["voterId","user","userId","userRef","voterRef"];
    for (const f of possibleObjectFields) {
      const val = allowed[f];
      if (val && mongoose.Types.ObjectId.isValid(String(val))) {
        voterObjectId = String(val);
        break;
      }
    }

    // If not found, try to find a User by common identifying fields
    if (!voterObjectId) {
      try {
        const userQueryFields = [
          { voterId: normalizedVoterId },
          { code: normalizedVoterId },
          { username: normalizedVoterId },
          { email: normalizedVoterId },
        ];
        let foundUser = null;
        for (const q of userQueryFields) {
          foundUser = await User.findOne(q).select("_id").lean();
          if (foundUser) break;
        }
        if (foundUser) voterObjectId = String(foundUser._id);
      } catch (uErr) {
        console.warn("CASTVOTE: user lookup error:", uErr && uErr.message);
      }
    }

    // PIN check (safe because allowed exists)
    const storedPin = (allowed.pin ?? allowed.PIN ?? allowed.pinCode ?? allowed.pin_number ?? null);
    if (String(storedPin).trim() !== String(pin).trim()) {
      console.log("CASTVOTE: pin mismatch -> stored:", storedPin, "provided:", pin);
      return res.status(400).json({ message: "pin mismatch" });
    }

    // Check voted flag
    if (allowed.voted || allowed.hasVoted || allowed.votedAt) {
      console.log("CASTVOTE: already voted according to allowed record");
      return res.status(409).json({ message: "This voter has already voted" });
    }

    // Build the values used by the existing unique index (legacy fields)
    // Ensure electionKey is an ObjectId (if possible) to match existing docs
    let electionKey = electionId;
    try { if (mongoose.Types.ObjectId.isValid(String(electionId))) electionKey = mongoose.Types.ObjectId(String(electionId)); } catch (e) {}

    // voterKey: use ObjectId when available, otherwise use string code to avoid many nulls
    let voterKey = voterObjectId ? (mongoose.Types.ObjectId(String(voterObjectId))) : normalizedVoterId;

    // pre-check duplicates using the same fields the DB index enforces
    try {
      const dupQuery = { election: electionKey, voter: voterKey };
      const exists = await Vote.findOne(dupQuery).lean();
      if (exists) {
        console.log("CASTVOTE: duplicate detected via legacy index fields", dupQuery);
        return res.status(409).json({ message: "Vote already recorded for this voter" });
      }
    } catch (dupErr) {
      console.warn("CASTVOTE: duplicate pre-check error:", dupErr && dupErr.message);
      // continue — the DB index will still protect, but we try to catch early
    }

    // Prepare vote payload: include both new and legacy field names to be safe.
    const votePayload = {
      // new-style fields
      electionId,
      candidateId,
      createdAt: new Date(),
      voterCode: normalizedVoterId,
    };

    if (voterObjectId) {
      votePayload.voterId = voterObjectId;
    }

    // legacy fields (to satisfy the existing unique index)
    votePayload.election = electionKey;
    votePayload.voter = voterKey;

    // Now write (transaction if possible)
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      await Vote.create([votePayload], { session });

      // update allowed voter record
      if (allowed._isRaw) {
        const collName = allowed._rawCollectionName || (AllowedVoter.collection && AllowedVoter.collection.name) || "allowedvoters";
        const coll = mongoose.connection.db.collection(collName);
        await coll.updateOne({ _id: allowed._id }, { $set: { voted: true, votedAt: new Date() } }, { session });
      } else {
        allowed.voted = true;
        allowed.votedAt = new Date();
        await allowed.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      console.log("CASTVOTE: vote recorded (transactional) for", normalizedVoterId);
      return res.status(201).json({ message: "Vote recorded successfully" });
    } catch (txErr) {
      if (session) {
        try { await session.abortTransaction(); session.endSession(); } catch (e) {}
      }
      console.warn("CASTVOTE: transaction failed, falling back:", txErr && txErr.message);

      // fallback non-transactional writes
      try {
        await Vote.create(votePayload);

        if (allowed._isRaw) {
          const collName = allowed._rawCollectionName || (AllowedVoter.collection && AllowedVoter.collection.name) || "allowedvoters";
          const rawColl = mongoose.connection.db.collection(collName);
          await rawColl.updateOne({ _id: allowed._id }, { $set: { voted: true, votedAt: new Date() } });
        } else {
          allowed.voted = true;
          allowed.votedAt = new Date();
          await allowed.save();
        }

        console.log("CASTVOTE: vote recorded (fallback) for", normalizedVoterId);
        return res.status(201).json({ message: "Vote recorded successfully" });
      } catch (fallbackErr) {
        console.error("CASTVOTE: fallback write error:", fallbackErr && (fallbackErr.stack || fallbackErr.message || fallbackErr));
        // If the failure is a duplicate key from the DB index, return 409 with friendly message
        if (fallbackErr && (fallbackErr.code === 11000 || String(fallbackErr).includes("E11000"))) {
          return res.status(409).json({ message: "Vote already recorded for this voter (duplicate index)" });
        }
        return res.status(500).json({ message: "Error saving vote" });
      }
    }
  } catch (err) {
    console.error("castVote error:", err && (err.stack || err.message || err));
    return res.status(500).json({ message: "Server error" });
  }
}

export default { castVote };
