// controllers/voteController.js
import mongoose from 'mongoose';
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Vote from '../models/Vote.js';

export async function castVote(req, res, next) {
  try {
    const electionId = req.params.id;
    const { candidateId } = req.body;

    if (!mongoose.isValidObjectId(electionId) || !mongoose.isValidObjectId(candidateId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    if (!req.user) return res.status(401).json({ message: 'Login required to vote' });

    // Only users with role 'voter' or 'candidate' can vote
    if (!(req.user.role === 'voter' || req.user.role === 'candidate')) {
      return res.status(403).json({ message: 'Only voters and candidates may cast votes' });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Check election time window
    const now = new Date();
    if (election.startAt && now < new Date(election.startAt)) return res.status(400).json({ message: 'Voting has not started yet' });
    if (election.endAt && now > new Date(election.endAt)) return res.status(400).json({ message: 'Voting has ended' });

    // allowedVoters check (if restricted)
    if (Array.isArray(election.allowedVoters) && election.allowedVoters.length) {
      const allowed = election.allowedVoters.map(String).includes(String(req.user._id));
      if (!allowed) return res.status(403).json({ message: 'You are not permitted to vote in this election' });
    }

    // ensure candidate belongs to this election
    const candidate = await Candidate.findOne({ _id: candidateId, election: election._id });
    if (!candidate) return res.status(400).json({ message: 'Invalid candidate for this election' });

    // check if user already voted
    const existing = await Vote.findOne({ election: election._id, voter: req.user._id });
    if (existing) return res.status(400).json({ message: 'You have already voted' });

    const vote = new Vote({
      election: election._id,
      candidate: candidate._id,
      voter: req.user._id,
      createdAt: new Date()
    });

    await vote.save();

    return res.json({ message: 'Vote cast' });
  } catch (err) {
    next(err);
  }
}

export default { castVote };
