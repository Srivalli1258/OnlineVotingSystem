// server/src/controllers/electionController.js
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Vote from '../models/Vote.js';
import mongoose from 'mongoose';


export async function createElection(req, res) {
  try {
    const { title, description, startAt, endAt, isPublic, allowedVoters, candidateEligibility, eligibility } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    // Only admin allowed (adjust per your auth)
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
 * - Public: will not throw when req.user is missing
 * - Normalized response: { election, candidates, canVote, hasVoted, votedFor, isCandidate }
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
      // if Candidate collection lookup fails, fall back to nested election.candidates
      // do not throw — we want the endpoint to remain available
      // eslint-disable-next-line no-console
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
      // If requester is authenticated, try to match by user id first, then by email
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
        // not authenticated, cannot verify membership => not allowed
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
        // don't break the endpoint — just log
        // eslint-disable-next-line no-console
        console.warn('Vote lookup failed', voteErr);
      }
    } else {
      // not logged in or role not allowed -> cannot vote
      canVote = false;
    }

    // Also determine if current user is a candidate in this election
    let isCandidate = false;
    if (req.user) {
      try {
        // check Candidate collection first
        if (Array.isArray(candidates) && candidates.length) {
          isCandidate = candidates.some(c => String(c.createdBy) === String(req.user._id));
        }
        // fallback: check nested election.candidates (if present)
        if (!isCandidate && Array.isArray(election.candidates) && election.candidates.length) {
          isCandidate = election.candidates.some(c => String(c.createdBy) === String(req.user._id) || String(c._id) === String(req.user.candidateId));
        }
      } catch (candCheckErr) {
        // eslint-disable-next-line no-console
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
 * - Users with role 'candidate' can register themselves (only once)
 */

// POST /api/elections/:id/candidates
// server/src/controllers/electionController.js

export async function addCandidate(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid election id' });

    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Basic eligibility check example — admin sets election.candidateEligibility string
    // You can parse rules more thoroughly
    const { name, age, manifesto, schemes } = req.body;
    if (!name || name.trim().length === 0) return res.status(400).json({ message: 'Name required' });

    // Example eligibility: if election.candidateEligibility contains "minAge:18"
    if (election.candidateEligibility) {
      const m = election.candidateEligibility.match(/minAge:(\d+)/);
      if (m && Number(m[1]) > 0) {
        const minAge = Number(m[1]);
        if (!age || Number(age) < minAge) {
          return res.status(400).json({ message: `Minimum age to participate is ${minAge}`, eligible: false });
        }
      }
    }

    // Add candidate to nested array
    const cand = {
      name: name.trim(),
      description: manifesto || '',
      manifesto: manifesto || '',
      schemes: Array.isArray(schemes) ? schemes : (schemes ? [schemes] : []),
      createdBy: req.user?._id
    };

    election.candidates.push(cand);
    await election.save();

    // return last inserted candidate (Mongoose gives _id)
    const added = election.candidates[election.candidates.length - 1];

    return res.status(201).json({ message: 'Candidate registered', candidate: added, eligible: true });
  } catch (err) {
    console.error('addCandidate error', err);
    return next(err);
  }
}


// Participate + infer schemes from manifesto
export async function participateAndRegister(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid election id' });

    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const election = await Election.findById(id).lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });

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

    // Basic eligibility checks (customize as needed)
    const errors = [];
    if (!eligibilityAnswers.verifiedId) errors.push('Proof of ID is required');
    if (eligibilityAnswers.age && Number(eligibilityAnswers.age) < 25) errors.push('Minimum age is 25');

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

    if (errors.length) return res.status(400).json({ message: 'Not eligible', reasons: errors });

    // Prevent duplicate registration by same user
    const existing = await Candidate.findOne({ election: id, createdBy: req.user._id }).lean();
    if (existing) return res.status(400).json({ message: 'You are already registered as a candidate for this election' });

    // Normalize incoming selected schemes (strings)
    const selectedSchemes = Array.isArray(incomingSchemes)
      ? incomingSchemes.map(s => String(s).trim()).filter(Boolean)
      : (incomingSchemes ? [String(incomingSchemes).trim()] : []);

    // Build inferred schemes from manifesto text by matching against election.schemesList
    // election.schemesList is expected: [{ code, title, description }]
    const inferred = new Set();

    if (manifesto && typeof manifesto === 'string' && Array.isArray(election.schemesList) && election.schemesList.length) {
      const txt = manifesto.toLowerCase();
      // token set from manifesto (words & multi-word phrases)
      const tokens = new Set(
        txt
          .replace(/[^\w\s-]/g, ' ') // remove punctuation
          .split(/\s+/)
          .map(t => t.trim())
          .filter(Boolean)
      );

      // helper to test matches
      const matchesManifesto = (field) => {
        if (!field) return false;
        const lower = String(field).toLowerCase();
        // direct substring match (allows multi-word)
        if (txt.includes(lower)) return true;
        // or any token match
        for (const tok of tokens) {
          if (tok.length > 2 && lower.includes(tok)) return true;
        }
        return false;
      };

      for (const s of election.schemesList) {
        // if codes or titles match manifesto, infer the scheme code/title
        if (s.code && matchesManifesto(s.code)) inferred.add(s.code);
        else if (s.title && matchesManifesto(s.title)) inferred.add(s.code || s.title);
        else {
          // also check words inside title
          const words = String(s.title || '').toLowerCase().split(/\s+/).filter(Boolean);
          for (const w of words) {
            if (tokens.has(w) && w.length > 2) {
              inferred.add(s.code || s.title);
              break;
            }
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
      approved: true,
      symbol: symbol || '',
      manifesto: manifesto || ''
    });

    await candidate.save();

    // Sync minimal data into election.candidates array (use update to avoid race)
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
        } } }
    );

    return res.status(201).json(candidate);
  } catch (err) {
    next(err);
  }
}
export async function getResults(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid election id' });

    // aggregate votes by candidate
    const agg = await Vote.aggregate([
      { $match: { election: mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
    ]);

    // Convert to candidateId->count mapping or array
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
  getResults
};