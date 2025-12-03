// server/src/controllers/voteController.js
import mongoose from "mongoose";
import AllowedVoter from "../models/AllowedVoter.js";
import Vote from "../models/Vote.js";
import Election from "../models/Election.js";

/**
 * castVote
 * POST /elections/:id/vote
 * Body: { candidateId, voterId, pin }
 */
export async function castVote(req, res) {
  try {
    const electionId = req.params.id;
    const { candidateId, voterId, pin } = req.body;

    console.log("CASTVOTE: body=", req.body);
    console.log("CASTVOTE: params -> electionId:", electionId, "candidateId:", candidateId);

    if (!candidateId || !voterId || !pin) {
      console.log("CASTVOTE: missing field ->", { candidateId, voterId, pin });
      return res.status(400).json({ message: "candidateId, voterId and pin are required" });
    }

    // Verify election exists and is open
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: "Election not found" });

    const now = new Date();
    if (election.startAt && now < new Date(election.startAt))
      return res.status(400).json({ message: "Election has not started" });

    if (election.endAt && now > new Date(election.endAt))
      return res.status(400).json({ message: "Election is closed" });

    // --------- Robust lookup with correct diagnostics & safe guards ----------
const normalizedVoterId = String(voterId).trim();
const canonicalVoterId = normalizedVoterId.toUpperCase();

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("CASTVOTE: mongoose db:", mongoose.connection.name, "readyState:", mongoose.connection.readyState);
const db = mongoose.connection.db;

// list collections (diagnostic)
let detectedCollName = "allowedvoters"; // default
try {
  const cols = await db.listCollections().toArray();
  const colNames = cols.map(c => c.name);
  console.log("CASTVOTE: collections in DB:", colNames);
  const candidates = ["allowedvoters", "allowedVoters", "allowed_voters", "allowed_voter", "allowedvoter"];
  const foundName = candidates.find(n => colNames.includes(n));
  detectedCollName = foundName || colNames.find(n => n.toLowerCase().includes("allowed")) || detectedCollName;
} catch (listErr) {
  console.warn("CASTVOTE: could not list collections:", listErr && listErr.message);
}

console.log("CASTVOTE: looking up voterId (normalized):", normalizedVoterId);
let allowed = null;

// 1) Try Mongoose model lookup first (safe regex)
try {
  const re = new RegExp(`^${escapeRegex(normalizedVoterId)}$`, "i");
  allowed = await AllowedVoter.findOne({ voterId: re });
  console.log("CASTVOTE: AllowedVoter model lookup returned:", !allowed);
} catch (mErr) {
  console.warn("CASTVOTE: AllowedVoter model lookup error:", mErr && mErr.message);
  allowed = null;
}

// --- DIAG: inspect the model's collection + db and compare to raw collection ---
try {
  console.log("CASTVOTE DIAG: AllowedVoter.model.collection.name:", AllowedVoter.collection && AllowedVoter.collection.name);
  console.log("CASTVOTE DIAG: AllowedVoter.model.db.name:", AllowedVoter.db && AllowedVoter.db.databaseName);
} catch (e) {
  console.warn("CASTVOTE DIAG: cannot read AllowedVoter.collection/db:", e && e.message);
}

try {
  const modelDoc = allowed ? { _id: String(allowed._id), voterId: allowed.voterId || allowed.voterID || null, pin: allowed.pin } : null;
  console.log("CASTVOTE DIAG: modelDoc (from AllowedVoter.findOne):", modelDoc);
} catch (e) {
  console.warn("CASTVOTE DIAG: cannot stringify model doc:", e && e.message);
}

// Raw DB handle diagnostics (the same object you use for raw lookups)
try {
  const rawDb = mongoose.connection.db;
  console.log("CASTVOTE DIAG: mongoose.connection.name:", mongoose.connection.name);
  console.log("CASTVOTE DIAG: rawDb.databaseName:", rawDb.databaseName || rawDb.s.databaseName);
  // how many collections on this raw DB?
  const cols = await rawDb.listCollections().toArray();
  console.log("CASTVOTE DIAG: rawDb collections:", cols.map(c=>c.name));
  // sample the raw allowedvoters collection
  const rawColl = rawDb.collection(AllowedVoter.collection && AllowedVoter.collection.name ? AllowedVoter.collection.name : "allowedvoters");
  const sample = await rawColl.find().limit(5).toArray();
  console.log("CASTVOTE DIAG: rawColl sample (collection used):", (rawColl && sample) ? sample.map(d => ({ _id: String(d._id), ...d })) : "no-coll");
  try {
    const cnt = await rawColl.countDocuments();
    console.log("CASTVOTE DIAG: rawColl count:", cnt);
  } catch(e) {
    console.warn("CASTVOTE DIAG: rawColl count error:", e && e.message);
  }
} catch (e) {
  console.warn("CASTVOTE DIAG: raw DB diagnostic error:", e && e.message);
}


// 2) Raw fallback using the detected collection name
if (!allowed) {
  try {
    console.log("CASTVOTE: using raw collection name:", detectedCollName);
    const rawColl = db.collection(detectedCollName);

    // quick probe: log first 5 docs and count (helps see why count == 0)
    try {
      const sampleDocs = await rawColl.find().limit(5).toArray();
      console.log("CASTVOTE: rawColl sample (first 5):", sampleDocs.map(d => ({ _id: String(d._id), ...d })));
      const cnt = await rawColl.countDocuments();
      console.log(`CASTVOTE: rawColl (${detectedCollName}) count:`, cnt);
    } catch (probeErr) {
      console.warn("CASTVOTE: rawColl probe error:", probeErr && probeErr.message);
    }

    // precise exact-match attempts on common field variants
    const fieldQueries = [
      { voterId: normalizedVoterId },
      { voterID: normalizedVoterId },
      { voterid: normalizedVoterId },
      { voterId: canonicalVoterId },
      { voterID: canonicalVoterId },
      { voterid: canonicalVoterId }
    ];

    let rawDoc = null;
    for (const q of fieldQueries) {
      rawDoc = await rawColl.findOne(q);
      if (rawDoc) {
        console.log("CASTVOTE: raw exact-match query succeeded with query:", q);
        break;
      }
    }

    // regex fallback if exact didn't find
    if (!rawDoc) {
      const escaped = escapeRegex(normalizedVoterId);
      rawDoc =
        (await rawColl.findOne({ voterId: { $regex: `^${escaped}$`, $options: "i" } })) ||
        (await rawColl.findOne({ voterID: { $regex: `^${escaped}$`, $options: "i" } })) ||
        (await rawColl.findOne({ voterid: { $regex: `^${escaped}$`, $options: "i" } }));
      if (rawDoc) console.log("CASTVOTE: raw regex match succeeded");
    }

    // fallback-scan: if still not found, scan small sample and try matching string fields
    if (!rawDoc) {
      try {
        // scan limit - adjust smaller if your collection is huge; for your seed data this is safe
        const scanLimit = 5000;
        const docsToScan = await rawColl.find().limit(scanLimit).toArray();
        const targetUpper = normalizedVoterId.toUpperCase();

        for (const doc of docsToScan) {
          for (const k of Object.keys(doc)) {
            const v = doc[k];
            if (typeof v === "string" && v.trim().toUpperCase() === targetUpper) {
              rawDoc = doc;
              console.log("CASTVOTE: fallback-scan matched field:", k, "value:", v, "doc._id:", String(doc._id));
              break;
            }
          }
          if (rawDoc) break;
        }
        if (!rawDoc) console.log("CASTVOTE: fallback-scan did not find a match in first", docsToScan.length, "docs");
      } catch (scanErr) {
        console.warn("CASTVOTE: fallback-scan error:", scanErr && scanErr.message);
      }
    }

    if (rawDoc) {
      rawDoc._isRaw = true;
      rawDoc._rawCollectionName = detectedCollName;
      allowed = rawDoc;
      console.log("CASTVOTE: raw allowed voter found:", allowed._id || allowed.voterId || allowed.voterID);
    } else {
      console.log("CASTVOTE: raw lookup found no matching voter for", normalizedVoterId, "in", detectedCollName);
    }
  } catch (rawErr) {
    console.error("CASTVOTE: raw collection lookup error:", rawErr && rawErr.stack || rawErr);
  }
}

// If still not found, return immediately (do NOT access allowed.pin)
if (!allowed) {
  console.log("CASTVOTE: voter not found for", normalizedVoterId);
  return res.status(400).json({ message: "voter not found" });
}

// ---------------------- now safe to check PIN and voted ----------------------
// Check pin (normalize both sides to string trimmed)
if (String(allowed.pin).trim() !== String(pin).trim()) {
  console.log("CASTVOTE: pin mismatch", { stored: allowed.pin, provided: pin });
  return res.status(400).json({ message: "pin mismatch" });
}

// check voted
if (allowed.voted) {
  console.log("CASTVOTE: already voted:", normalizedVoterId);
  return res.status(400).json({ message: "This voter has already voted" });
}


    // --- Try a transaction (if supported), otherwise fallback to non-transactional writes ---
    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      // create vote within transaction
      await Vote.create(
        [
          {
            electionId,
            candidateId,
            voterId: allowed.voterId || allowed.voterID || normalizedVoterId,
            createdAt: new Date()
          }
        ],
        { session }
      );

      // update allowed voter - handle raw doc vs mongoose doc
      if (allowed._isRaw) {
        const collNameToUse = allowed._rawCollectionName || "allowedvoters";
        const collToUse = mongoose.connection.db.collection(collNameToUse);
        // include session only when it exists
        if (session) {
          await collToUse.updateOne(
            { _id: allowed._id },
            { $set: { voted: true, votedAt: new Date() } },
            { session }
          );
        } else {
          await collToUse.updateOne(
            { _id: allowed._id },
            { $set: { voted: true, votedAt: new Date() } }
          );
        }
      } else {
        allowed.voted = true;
        allowed.votedAt = new Date();
        await allowed.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
      return res.json({ message: "Vote recorded successfully" });
    } catch (txErr) {
      if (session) {
        try {
          await session.abortTransaction();
          session.endSession();
        } catch (e) {}
      }
      console.warn("CASTVOTE: transaction failed, falling back - reason:", txErr.message || txErr);

      // Fallback: create vote and update allowed voter without transaction
      try {
        await Vote.create({
          electionId,
          candidateId,
          voterId: allowed.voterId || allowed.voterID || normalizedVoterId,
          createdAt: new Date()
        });

        if (allowed._isRaw) {
          const collNameToUse = allowed._rawCollectionName || "allowedvoters";
          const rawColl = mongoose.connection.db.collection(collNameToUse);
          await rawColl.updateOne(
            { _id: allowed._id },
            { $set: { voted: true, votedAt: new Date() } }
          );
        } else {
          allowed.voted = true;
          allowed.votedAt = new Date();
          await allowed.save();
        }

        return res.json({ message: "Vote recorded successfully" });
      } catch (fallbackErr) {
        console.error("CASTVOTE: fallback write error:", fallbackErr);
        return res.status(500).json({ message: "Error saving vote" });
      }
    }
  } catch (err) {
    console.error("castVote error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export default { castVote };
