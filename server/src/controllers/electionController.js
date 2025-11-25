// controllers/electionController.js
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Vote from '../models/Vote.js';
import mongoose from 'mongoose';

export async function createElection(req, res, next) {
  try {
    // Only admin may create elections
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create elections' });
    }

    const { title, description, startAt, endAt, isPublic, allowedVoters } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    const election = new Election({
      title,
      description,
      createdBy: req.user._id,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      isPublic: isPublic !== undefined ? isPublic : true,
      allowedVoters: Array.isArray(allowedVoters) ? allowedVoters : (allowedVoters ? [allowedVoters] : [])
    });

    await election.save();
    res.status(201).json(election);
  } catch (err) {
    next(err);
  }
}

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

export async function getElection(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid election id' });
    }

    const election = await Election.findById(id).populate('createdBy', 'name email').lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const candidates = await Candidate.find({ election: election._id }).sort({ createdAt: 1 }).lean();

    // Determine voting permissions/status
    let canVote = false;
    let hasVoted = false;
    let votedFor = null;

    const now = new Date();
    const started = !election.startAt || now >= new Date(election.startAt);
    const notEnded = !election.endAt || now <= new Date(election.endAt);

    // Allowed voters check (if set)
    const allowed = (Array.isArray(election.allowedVoters) && election.allowedVoters.length)
      ? election.allowedVoters.map(String).includes(String(req.user?._id))
      : true;

    // If user exists and is role 'voter' or 'candidate', consider them eligible
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
        // ignore vote-check errors but log
        console.warn('vote check failed', voteErr);
      }
    } else {
      // not logged in or role not allowed -> cannot vote
      canVote = false;
    }

    // Also mark if the current user is a candidate in this election
    let isCandidate = false;
    if (req.user) {
      isCandidate = candidates.some(c => String(c.createdBy) === String(req.user._id) || String(c._id) === String(req.user.candidateId));
      // note: if you store candidate user link differently, adjust above check
    }

    return res.json({ election, candidates, canVote, hasVoted, votedFor, isCandidate });
  } catch (err) {
    next(err);
  }
}

export async function addCandidate(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid election id' });
    }

    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Only admin OR users with role 'candidate' may register themselves as candidates.
    // Admins may add arbitrary candidates.
    if (!req.user) return res.status(403).json({ message: 'Authentication required' });

    const isAdmin = req.user.role === 'admin';
    const isCandidateRole = req.user.role === 'candidate';

    if (!isAdmin && !isCandidateRole) {
      return res.status(403).json({ message: 'Only admin or candidate users may add candidates' });
    }

    // If candidate role user is adding, prefill the createdBy to the user and prevent multiple candidate entries by same user
    if (isCandidateRole) {
      const existing = await Candidate.findOne({ election: election._id, createdBy: req.user._id }).lean();
      if (existing) return res.status(400).json({ message: 'You are already registered as a candidate for this election' });
    }

    // Body fields for candidate (admins can supply any details)
    const { name, description, party, schemes, avatarUrl } = req.body;

    // If candidate-role user didn't provide name, use their name from profile
    const candidateName = name || req.user?.name || 'Unnamed Candidate';
    if (!candidateName) return res.status(400).json({ message: 'Candidate name required' });

    const candidate = new Candidate({
      election: election._id,
      name: candidateName,
      description: description || '',
      party: party || '',
      schemes: Array.isArray(schemes) ? schemes : (schemes ? [schemes] : []),
      avatarUrl: avatarUrl || '',
      createdBy: req.user._id
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (err) {
    next(err);
  }
}

export async function getResults(req, res, next) {
  try {
    const electionId = req.params.id;
    if (!mongoose.isValidObjectId(electionId)) return res.status(400).json({ message: 'Invalid' });

    // only admin allowed
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const counts = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const populated = await Promise.all(counts.map(async c => {
      const cand = await Candidate.findById(c._id).select('name').lean();
      return { candidate: cand ? { id: cand._id, name: cand.name } : { id: c._id, name: 'Unknown' }, count: c.count };
    }));

    res.json({ results: populated });
  } catch (err) {
    next(err);
  }
}

export default {
  createElection,
  listElections,
  getElection,
  addCandidate,
  getResults,
};
