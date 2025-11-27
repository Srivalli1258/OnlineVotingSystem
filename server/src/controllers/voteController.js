// server/src/controllers/voteController.js
import mongoose from 'mongoose';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import Candidate from '../models/Candidate.js';

/**
 * Cast a vote for a candidate in an election
 * POST /api/elections/:id/vote
 * Body: { candidateId }
 */
export async function castVote(req, res, next) {
  try {
    const { id } = req.params; // election id
    const { candidateId } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    // allow voters and candidates to vote (adjust if you only want voters)
    const role = String(req.user.role || '').toLowerCase();
    if (!(role === 'voter' || role === 'candidate' || role === 'admin')) {
      return res.status(403).json({ message: 'Only voters or candidates may cast a vote' });
    }

    // Basic id validation
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid election id' });

    // candidateId might be sent as an object; ensure it's a string id
    let candId = candidateId;
    if (typeof candidateId === 'object' && candidateId !== null) {
      // try common shapes
      candId = candidateId._id || candidateId.id || String(candidateId);
    }
    if (!mongoose.isValidObjectId(candId)) {
      return res.status(400).json({ message: 'Invalid candidate id' });
    }

    // Use lean for read-only, but we'll not rely on mongoose document helpers when using lean()
    const election = await Election.findById(id).lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const now = new Date();
    if (election.startAt && now < new Date(election.startAt)) {
      return res.status(400).json({ message: 'Election has not started' });
    }
    if (election.endAt && now > new Date(election.endAt)) {
      return res.status(400).json({ message: 'Election has ended' });
    }

    // Ensure candidate belongs to this election (check nested list)
    const belongs = Array.isArray(election.candidates) &&
      election.candidates.some(c => String(c._id) === String(candId));

    // Also check Candidate collection if you persist candidates separately
    const candidateDoc = await Candidate.findOne({ _id: candId, election: id }).lean();

    if (!belongs && !candidateDoc) {
      return res.status(400).json({ message: 'Candidate does not belong to this election' });
    }

    // Prevent duplicate votes by same user
    const existing = await Vote.findOne({ election: id, voter: req.user._id }).lean();
    if (existing) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Build Vote document with mongoose ObjectId wrappers (explicit `new` ensures no runtime error)
    const vote = new Vote({
      election: new mongoose.Types.ObjectId(id),
      candidate: new mongoose.Types.ObjectId(candId),
      voter: new mongoose.Types.ObjectId(req.user._id),
      createdAt: new Date()
    });

    await vote.save();

    // Return counts (handy for UI)
    const agg = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } }
    ]);

    const counts = {};
    for (const r of agg) counts[String(r._id)] = r.count;

    return res.status(201).json({ message: 'Vote recorded', counts });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('castVote error', err);
    // Send non-sensitive error message
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default { castVote };
