// server/src/controllers/electionController.js
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Vote from '../models/Vote.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Create election (admin)
 */
export async function createElection(req, res) {
  try {
    const { title, description, startAt, endAt, isPublic, allowedVoters, candidateEligibility, eligibility } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (String(req.user.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create elections' });
    }

    if (!title) return res.status(400).json({ message: 'Title is required' });

    const newElection = new Election({
      title,
      description,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      isPublic: Boolean(isPublic),
      allowedVoters: Array.isArray(allowedVoters) ? allowedVoters : [],
      candidateEligibility: candidateEligibility || '',
      eligibility: eligibility || '',
      createdBy: req.user._id
    });

    await newElection.save();

    return res.status(201).json({ message: 'Election created', election: newElection });
  } catch (err) {
    console.error('createElection error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * List elections (public)
 */
export async function listElections(req, res, next) {
  try {
    const elections = await Election.find()
      .sort({ startAt: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();
    res.json(elections);
  } catch (err) {
    next(err);
  }
}

/**
 * Get single election (returns normalized payload expected by frontend)
 */
export async function getElection(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid election id' });
    }

    const election = await Election.findById(id).populate('createdBy', 'name email').lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Try to load candidates from separate Candidate collection first
    let candidates = [];
    try {
      candidates = await Candidate.find({ election: election._id }).sort({ createdAt: 1 }).lean();
    } catch (candErr) {
      console.warn('Candidate lookup failed — falling back to nested candidates if any', candErr);
      candidates = [];
    }

    // If no candidates found in Candidate collection, check nested `election.candidates` (backwards compatibility)
    if ((!candidates || candidates.length === 0) && Array.isArray(election.candidates) && election.candidates.length) {
      candidates = election.candidates.map(c => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        party: c.party,
        schemes: c.schemes || [],
        createdBy: c.createdBy,
        createdAt: c.createdAt
      }));
    }

    // Determine voting permissions/status
    let canVote = false;
    let hasVoted = false;
    let votedFor = null;

    const now = new Date();
    const started = !election.startAt || now >= new Date(election.startAt);
    const notEnded = !election.endAt || now <= new Date(election.endAt);

    // Allowed voters check (if set) — default to true when allowedVoters not provided
    let allowed = true;
    if (Array.isArray(election.allowedVoters) && election.allowedVoters.length) {
      if (req.user) {
        const uid = String(req.user._id);
        const email = req.user.email ? String(req.user.email).toLowerCase() : null;
        allowed = election.allowedVoters.some(av => {
          const s = String(av);
          if (s === uid) return true;
          if (email && String(s).toLowerCase() === email) return true;
          return false;
        });
      } else {
        allowed = false;
      }
    }

    // If user exists and has role 'voter' or 'candidate', consider them eligible if dates & allowed check pass
    if (req.user && (req.user.role === 'voter' || req.user.role === 'candidate')) {
      canVote = started && notEnded && allowed;
      // check if they already voted
      try {
        const existing = await Vote.findOne({ election: election._id, voter: req.user._id }).lean();
        if (existing) {
          hasVoted = true;
          votedFor = existing.candidate;
          canVote = false; // once voted, can't vote again
        }
      } catch (voteErr) {
        console.warn('Vote lookup failed', voteErr);
      }
    } else {
      canVote = false;
    }

    // Also determine if current user is a candidate in this election
    let isCandidate = false;
    if (req.user) {
      try {
        if (Array.isArray(candidates) && candidates.length) {
          isCandidate = candidates.some(c => String(c.createdBy) === String(req.user._id));
        }
        if (!isCandidate && Array.isArray(election.candidates) && election.candidates.length) {
          isCandidate = election.candidates.some(c => String(c.createdBy) === String(req.user._id) || String(c._id) === String(req.user.candidateId));
        }
      } catch (candCheckErr) {
        console.warn('isCandidate check failed', candCheckErr);
        isCandidate = false;
      }
    }

    return res.json({ election, candidates, canVote, hasVoted, votedFor, isCandidate });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a candidate to an election.
 * - Admins can add arbitrary candidates
 * - Users can register themselves (only once)
 *
 * POST /api/elections/:id/candidates
 */
export async function addCandidate(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid election id' });

    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const { name, age, manifesto, schemes } = req.body;
    if (!name || name.trim().length === 0) return res.status(400).json({ message: 'Name required' });

    // If election has a candidateEligibility string like "minAge:18" parse it
    if (election.candidateEligibility) {
      const m = election.candidateEligibility.match(/minAge:(\d+)/);
      if (m && Number(m[1]) > 0) {
        const minAge = Number(m[1]);
        if (!age || Number(age) < minAge) {
          return res.status(400).json({ message: `Minimum age to participate is ${minAge}`, eligible: false });
        }
      }
    }

    // allow admin to add arbitrary candidate (no createdBy check)
    if (req.user && String(req.user.role).toLowerCase() === 'admin') {
      const adminCand = {
        name: name.trim(),
        description: manifesto || '',
        manifesto: manifesto || '',
        schemes: Array.isArray(schemes) ? schemes : (schemes ? [schemes] : []),
        createdBy: req.user._id
      };
      election.candidates.push(adminCand);
      await election.save();
      const added = election.candidates[election.candidates.length - 1];
      return res.status(201).json({ message: 'Candidate added by admin', candidate: added, eligible: true });
    }

    // For normal users: ensure authentication and prevent duplicates
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const already = await Candidate.findOne({ election: id, createdBy: req.user._id }).lean();
    if (already) return res.status(409).json({ message: 'You have already applied for this election' });

    // Create candidate document in Candidate collection and also sync to election's nested array
    const candidateDoc = new Candidate({
      election: id,
      name: name.trim(),
      description: manifesto || '',
      party: req.body.party || '',
      schemes: Array.isArray(schemes) ? schemes : (schemes ? [schemes] : []),
      createdBy: req.user._id,
      eligibilityData: { age: age || null },
      approved: false,
      manifesto: manifesto || ''
    });

    // Save candidate and update election in a transaction (best-effort)
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await candidateDoc.save({ session });
      await Election.updateOne(
        { _id: id },
        { $push: { candidates: {
            _id: candidateDoc._id,
            name: candidateDoc.name,
            description: candidateDoc.description,
            party: candidateDoc.party,
            schemes: candidateDoc.schemes,
            createdBy: candidateDoc.createdBy,
            createdAt: candidateDoc.createdAt,
            symbol: candidateDoc.symbol || '',
            manifesto: candidateDoc.manifesto || ''
          } } },
        { session }
      );
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    return res.status(201).json({ message: 'Candidate registered (pending approval)', candidate: candidateDoc, eligible: true });
  } catch (err) {
    console.error('addCandidate error', err);
    return next(err);
  }
}

/**
 * Participate + infer schemes from manifesto and register
 * POST /api/elections/:id/participate
 */
// Example: server/src/controllers/electionController.js
// Replace your existing participateAndRegister / participate handler with this.


// Replace the existing participateAndRegister with this function
// Paste this function into server/src/controllers/electionController.js

export async function participateAndRegister(req, res) {
  const electionId = req.params.id;
  const payload = req.body || {};
  const actorId = (req.admin && req.admin._id) || (req.user && req.user._id) || null;

  // DEBUG: log incoming request (trim long bodies)
  try { console.log('[DEBUG PARTICIPATE] incoming payload:', JSON.stringify(req.body).slice(0, 2000)); } catch(e){}

  // Normalize name (accept name or fullName)
  const fullName = (payload.fullName || payload.name || '').trim();
  if (!fullName) {
    return res.status(400).json({ message: 'Full name is required' });
  }

  // Aadhaar optional validation
  const aadhaar = payload.aadhaar ? String(payload.aadhaar).trim() : null;
  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    return res.status(400).json({ message: 'Aadhaar must be 12 digits' });
  }

  const address = payload.address ? String(payload.address).trim() : '';

  // Non-transactional write helper (ensures awaited saves + logs)
  async function doNonTransactional() {
    const election = await Election.findById(electionId);
    if (!election) throw { status: 404, message: 'Election not found' };

    // Duplicate checks
    if (actorId) {
      const alreadyByUser = await Candidate.findOne({ election: electionId, createdBy: actorId }).lean();
      if (alreadyByUser) throw { status: 409, message: 'You have already applied for this election' };
    }
    if (aadhaar) {
      const alreadyByAadhaar = await Candidate.findOne({ election: electionId, aadhaar }).lean();
      if (alreadyByAadhaar) throw { status: 409, message: 'An application with this Aadhaar already exists' };
    }

    const candidate = new Candidate({
      election: election._id,
      name: fullName,          // required by schema
      fullName: fullName,
      aadhaar: aadhaar || undefined,
      address: address || '',
      party: payload.party || '',
      symbol: payload.symbol || '',
      manifesto: payload.manifesto || '',
      schemes: Array.isArray(payload.schemes) ? payload.schemes : (payload.schemes ? [payload.schemes] : []),
      age: payload.age || null,
      idProofProvided: !!payload.idProofProvided,
      createdBy: actorId || null
    });

    // Save candidate and log
    await candidate.save();
    console.log('[DEBUG PARTICIPATE] candidate saved id=', candidate._id.toString());

    // Sync into election.candidates if nested array exists
    if (Array.isArray(election.candidates)) {
      election.candidates.push({
        _id: candidate._id,
        name: candidate.name,
        fullName: candidate.fullName || '',
        address: candidate.address || '',
        party: candidate.party || '',
        schemes: candidate.schemes || [],
        createdBy: candidate.createdBy,
        createdAt: candidate.createdAt,
        symbol: candidate.symbol || '',
        manifesto: candidate.manifesto || ''
      });
      await election.save(); // IMPORTANT: await this
      console.log('[DEBUG PARTICIPATE] election updated id=', election._id.toString());
    }

    return candidate;
  }

  // Transactional attempt then fallback
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const election = await Election.findById(electionId).session(session);
    if (!election) {
      await session.abortTransaction().catch(()=>{});
      session.endSession();
      return res.status(404).json({ message: 'Election not found' });
    }

    // Transactional duplicate checks
    if (actorId) {
      const alreadyByUser = await Candidate.findOne({ election: electionId, createdBy: actorId }).session(session).lean();
      if (alreadyByUser) {
        await session.abortTransaction().catch(()=>{});
        session.endSession();
        return res.status(409).json({ message: 'You have already applied for this election' });
      }
    }
    if (aadhaar) {
      const alreadyByAadhaar = await Candidate.findOne({ election: electionId, aadhaar }).session(session).lean();
      if (alreadyByAadhaar) {
        await session.abortTransaction().catch(()=>{});
        session.endSession();
        return res.status(409).json({ message: 'An application with this Aadhaar already exists' });
      }
    }

    const candidateData = {
      election: election._id,
      name: fullName,
      fullName: fullName,
      aadhaar: aadhaar || undefined,
      address: address || '',
      party: payload.party || '',
      symbol: payload.symbol || '',
      manifesto: payload.manifesto || '',
      schemes: Array.isArray(payload.schemes) ? payload.schemes : (payload.schemes ? [payload.schemes] : []),
      age: payload.age || null,
      idProofProvided: !!payload.idProofProvided,
      createdBy: actorId || null
    };

    const created = await Candidate.create([candidateData], { session });
    const candidate = created[0];

    // push to nested array (if used) — **fixed**: push full nested object (not only _id)
    const nestedCandidateObj = {
      _id: candidate._id,
      name: candidate.name,
      fullName: candidate.fullName || '',
      address: candidate.address || '',
      party: candidate.party || '',
      schemes: candidate.schemes || [],
      createdBy: candidate.createdBy,
      createdAt: candidate.createdAt,
      symbol: candidate.symbol || '',
      manifesto: candidate.manifesto || ''
    };

    if (Array.isArray(election.candidates)) {
      election.candidates.push(nestedCandidateObj);
    } else {
      election.candidates = [nestedCandidateObj];
    }

    await election.save({ session });

    await session.commitTransaction();
    session.endSession();
    console.log('[DEBUG PARTICIPATE] transaction committed, candidate=', candidate._id.toString());

    return res.status(201).json({ candidate });
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    console.warn('[PARTICIPATE] transactional path failed:', msg);

    // cleanup session
    try { if (session) { await session.abortTransaction().catch(()=>{}); session.endSession(); } } catch(e){}

    // fallback to non-transactional if transactions not available
    if (/Transaction numbers are only allowed on a replica set member|transactions are not supported/i.test(msg)) {
      try {
        const candidate = await doNonTransactional();
        return res.status(201).json({ candidate });
      } catch (fallbackErr) {
        // Validation errors -> 400
        if (fallbackErr && fallbackErr.name === 'ValidationError') {
          const details = Object.values(fallbackErr.errors || {}).map(e => e.message);
          return res.status(400).json({ message: 'Validation failed', details });
        }
        const status = fallbackErr?.status || 500;
        console.error('[PARTICIPATE] fallback error', fallbackErr);
        return res.status(status).json({ message: fallbackErr?.message || 'Server error' });
      }
    }

    // If validation error in transactional branch
    if (err && err.name === 'ValidationError') {
      const details = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', details });
    }

    // otherwise log & return
    console.error('[PARTICIPATE] error', err && err.stack ? err.stack : err);
    const status = err?.status || 500;
    return res.status(status).json({ message: err?.message || 'Server error' });
  }
}



export async function getResults(req, res) {
  try {
    const electionId = req.params.id;

    console.log("getResults → electionId =", electionId);

    // Safely convert ID
    let electionObjId = null;
    if (mongoose.Types.ObjectId.isValid(electionId)) {
      try {
        electionObjId = new mongoose.Types.ObjectId(electionId);
      } catch (e) {
        console.log("ObjectId conversion failed:", e.message);
      }
    }

    // MATCH both versions (string + ObjectId)
    const matchConditions = {
      $or: [
        { electionId: electionId },
        { electionId: electionObjId }
      ]
    };

    console.log("MATCH CONDITION =", matchConditions);

    const votes = await Vote.aggregate([
      { $match: matchConditions },

      // Join candidate data
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "cinfo"
        }
      },

      // Join user ONLY if voterId is ObjectId
      {
        $lookup: {
          from: "users",
          localField: "voterId",
          foreignField: "_id",
          as: "uinfo"
        }
      },

      {
        $project: {
          _id: 0,
          voterCode: 1,
          voterId: 1,
          candidateId: 1,
          createdAt: 1,
          candidateName: { $arrayElemAt: ["$cinfo.name", 0] },
          voterName: { $arrayElemAt: ["$uinfo.name", 0] }
        }
      }
    ]);

    return res.json({ votes });
  } catch (err) {
    console.error("getResults ERROR:", err);
    return res.status(500).json({ message: "Server error loading results" });
  }
}
