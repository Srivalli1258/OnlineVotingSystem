// server/src/controllers/electionController.js
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Vote from '../models/Vote.js';
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
export async function participateAndRegister(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      await session.endSession();
      return res.status(400).json({ message: 'Invalid election id' });
    }

    if (!req.user) {
      await session.endSession();
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Load election (we want a document so we can update)
    const election = await Election.findById(id);
    if (!election) {
      await session.endSession();
      return res.status(404).json({ message: 'Election not found' });
    }

    // Incoming payload
    const {
      eligibilityAnswers = {},
      schemes: incomingSchemes = [],
      name,
      description,
      party,
      symbol,
      manifesto = ''
    } = req.body;

    // Basic eligibility checks (customize to your needs)
    const errors = [];
    if (!eligibilityAnswers.verifiedId) errors.push('Proof of ID is required');
    if (eligibilityAnswers.age && Number(eligibilityAnswers.age) < 25) errors.push('Minimum age is 25');

    // Allowed voters check (if election restricts)
    if (Array.isArray(election.allowedVoters) && election.allowedVoters.length) {
      const uid = String(req.user._id);
      const email = req.user.email ? String(req.user.email).toLowerCase() : null;
      const allowed = election.allowedVoters.some(av => {
        const s = String(av);
        if (s === uid) return true;
        if (email && String(s).toLowerCase() === email) return true;
        return false;
      });
      if (!allowed) errors.push('You are not in the allowed voters list for this election');
    }

    if (errors.length) {
      await session.endSession();
      return res.status(400).json({ message: 'Not eligible', reasons: errors });
    }

    // Prevent duplicate registration by same user
    const existing = await Candidate.findOne({ election: id, createdBy: req.user._id }).lean();
    if (existing) {
      await session.endSession();
      return res.status(400).json({ message: 'You are already registered as a candidate for this election' });
    }

    // Normalize incoming selected schemes (strings)
    const selectedSchemes = Array.isArray(incomingSchemes)
      ? incomingSchemes.map(s => String(s).trim()).filter(Boolean)
      : (incomingSchemes ? [String(incomingSchemes).trim()] : []);

    // Build inferred schemes from manifesto text by matching against election.schemesList
    // election.schemesList is expected: [{ code, title, description }]
    const inferred = new Set();

    if (manifesto && typeof manifesto === 'string' && Array.isArray(election.schemesList) && election.schemesList.length) {
      const txt = manifesto.toLowerCase();
      const tokens = new Set(
        txt
          .replace(/[^\w\s-]/g, ' ')
          .split(/\s+/)
          .map(t => t.trim())
          .filter(Boolean)
      );

      const matchesManifesto = (field) => {
        if (!field) return false;
        const lower = String(field).toLowerCase();
        if (txt.includes(lower)) return true;
        for (const tok of tokens) {
          if (tok.length > 2 && lower.includes(tok)) return true;
        }
        return false;
      };

      for (const s of election.schemesList) {
        if (!s) continue;
        if ((s.code && matchesManifesto(s.code)) || (s.title && matchesManifesto(s.title))) {
          inferred.add(s.code || s.title);
          continue;
        }
        const words = String(s.title || '').toLowerCase().split(/\s+/).filter(Boolean);
        for (const w of words) {
          if (tokens.has(w) && w.length > 2) {
            inferred.add(s.code || s.title);
            break;
          }
        }
      }
    }

    // Final schemes = selected ∪ inferred
    const finalSchemes = Array.from(new Set([
      ...selectedSchemes,
      ...Array.from(inferred).map(s => String(s).trim()).filter(Boolean)
    ]));

    // Prepare candidate doc
    const candidate = new Candidate({
      election: id,
      name: name || req.user.name || 'Unnamed Candidate',
      description: description || manifesto || '',
      party: party || '',
      schemes: finalSchemes,
      createdBy: req.user._id,
      eligibilityData: eligibilityAnswers,
      approved: true, // set to true here; change to false if admin approval required
      symbol: symbol || '',
      manifesto: manifesto || ''
    });

    // Save candidate + sync to Election.candidates inside a transaction
    session.startTransaction();
    try {
      await candidate.save({ session });
      await Election.updateOne(
        { _id: id },
        { $push: { candidates: {
            _id: candidate._id,
            name: candidate.name,
            description: candidate.description,
            party: candidate.party,
            schemes: candidate.schemes,
            createdBy: candidate.createdBy,
            createdAt: candidate.createdAt,
            symbol: candidate.symbol || '',
            manifesto: candidate.manifesto || ''
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

    return res.status(201).json(candidate);
  } catch (err) {
    console.error('participateAndRegister error', err);
    try {
      await session.endSession();
    } catch (_) {}
    return next(err);
  }
}

/**
 * Get results (aggregate vote counts by candidate)
 */
export async function getResults(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid election id' });

    const agg = await Vote.aggregate([
      { $match: { election: mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
    ]);

    const results = (agg || []).map(r => ({ candidateId: String(r._id), count: r.count }));

    return res.json({ results });
  } catch (err) {
    console.error('getResults error', err);
    return next(err);
  }
}

export default {
  listElections,
  getElection,
  createElection,
  addCandidate,
  participateAndRegister,
  getResults
};
