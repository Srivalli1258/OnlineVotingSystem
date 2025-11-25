// routes/elections.js
import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createElection,
  listElections,
  getElection,
  addCandidate,
  getResults
} from '../controllers/electionController.js';
import { castVote } from '../controllers/voteController.js';

const router = express.Router();

/**
 * Small helper to wrap async route handlers and forward errors to next()
 * so you don't need try/catch in every route here.
 */
const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Important: keep this before the dynamic :id routes so '/create' is not treated as an id
router.get('/create', (req, res) => {
  res.json({ message: 'Create election route (handled by frontend SPA)' });
});

// List elections (public)
router.get('/', wrap(listElections));

// Create election (authenticated: user/admin - controller should enforce role if needed)
router.post('/', requireAuth, wrap(createElection));

/**
 * Validate :id only once using router.param — this keeps routes clean and DRY.
 * If id is invalid we return 400 immediately.
 */
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid election id' });
  }
  next();
});

// Get election details (must be authenticated)
router.get('/:id', requireAuth, wrap(getElection));

// Add candidate to election (creator or admin only — controller enforces authorization)
router.post('/:id/candidates', requireAuth, wrap(addCandidate));

// Cast vote in election
router.post('/:id/vote', requireAuth, wrap(castVote));

// Get results (admin only — controller enforces authorization)
router.get('/:id/results', requireAuth, wrap(getResults));

export default router;
