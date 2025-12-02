// server/src/routes/elections.js
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import { adminAuth } from '../middleware/adminAuth.js'; // admin-only middleware
import User from '../models/User.js'; // user model used by requireAuth

import {
  createElection,
  listElections,
  getElection,
  addCandidate,
  getResults,
  participateAndRegister
} from '../controllers/electionController.js';
import { castVote } from '../controllers/voteController.js';

const router = express.Router();

/**
 * Minimal requireAuth middleware (local copy).
 * This mirrors your previous logic (verifies Bearer token, loads User by payload.id).
 * It avoids depending on an external import that might not exist.
 */
export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token' });
    }
    const token = auth.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // payload.id is expected (your auth previously used payload.id)
    const userId = payload.id || payload.sub || payload.userId || null;
    if (!userId) return res.status(401).json({ message: 'Invalid token payload' });

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'Invalid token - user not found' });

    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth error', err);
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
}

/**
 * Small helper to wrap async route handlers and forward errors to next()
 */
const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Keep static route before dynamic :id
router.get('/create', (req, res) => {
  res.json({ message: 'Create election route (handled by frontend SPA)' });
});

// List elections (public)
router.get('/', wrap(listElections));

// Create election (admin-only)
router.post('/', adminAuth, wrap(createElection));

/**
 * Validate :id once using router.param — this keeps routes clean and DRY.
 * If id is invalid we return 400 immediately.
 */
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid election id' });
  }
  next();
});

// Get election (public, normalized)
router.get('/:id', wrap(getElection));

// Add candidate to election (authenticated user)
router.post('/:id/candidates', requireAuth, wrap(addCandidate));

// Backwards-compatible "apply" endpoint (some clients/old code use /:electionId/apply)
router.post('/:id/apply', requireAuth, wrap(participateAndRegister));
// Also keep new-style path under candidates if you prefer
router.post('/:id/candidates/participate', requireAuth, wrap(participateAndRegister));

// Cast vote (authenticated)
router.post('/:id/vote', requireAuth, wrap(castVote));

// Get results (admin-only)
router.get('/:id/results', adminAuth, wrap(getResults));

export default router;
  