// server/src/routes/elections.js
import express from 'express';
import mongoose from 'mongoose';

// user auth middleware (verify voter/candidate)
import { requireAuth } from '../middleware/authMiddleware.js';

// admin auth middleware (verify admin token)
import { adminAuth } from '../middleware/adminAuth.js';

// import whole controller module (works with named or default exports)
import * as electionController from '../controllers/electionController.js';
import { castVote } from '../controllers/voteController.js';

const router = express.Router();

const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Helper: pick a handler from controller exports safely.
 * Accepts:
 *   - named export function (e.g. export function listElections...)
 *   - default export object (e.g. export default { listElections: () => {} })
 * If handler not found, returns a 501 handler that won't crash the server.
 */
function resolveHandler(exported, name) {
  // if it's a function already, return it
  if (typeof exported === 'function') return exported;

  // try to find in the imported controller object
  if (electionController && typeof electionController[name] === 'function') return electionController[name];

  // try default export object (electionController.default)
  if (electionController && electionController.default && typeof electionController.default[name] === 'function') {
    return electionController.default[name];
  }

  // fallback: return a safe "not implemented" handler
  return (req, res) => {
    res.status(501).json({ message: `${name} not implemented on server` });
  };
}

// static create route (frontend SPA handles actual creation UI)
router.get('/create', (req, res) => {
  res.json({ message: 'Create election route (handled by frontend SPA)' });
});

// resolve controller handlers safely
const listFn = resolveHandler(electionController.listElections, 'listElections');
const createFn = resolveHandler(electionController.createElection, 'createElection');
const getFn = resolveHandler(electionController.getElection, 'getElection');
const addCandFn = resolveHandler(electionController.addCandidate, 'addCandidate');
const participateFn = resolveHandler(electionController.participateAndRegister, 'participateAndRegister');
const resultsFn = resolveHandler(electionController.getResults, 'getResults');

// Public list
router.get('/', wrap(listFn));

// Create election — admin only
router.post('/', adminAuth, wrap(createFn));

/**
 * :id validation once using router.param — keeps routes DRY.
 * If id is invalid we return 400 immediately.
 */
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid election id' });
  }
  next();
});

// Get election (public)
router.get('/:id', wrap(getFn));

// Add candidate (user must be authenticated)
router.post('/:id/candidates', requireAuth, wrap(addCandFn));

// Backwards-compatible apply endpoint (user must be authenticated)
router.post('/:id/apply', requireAuth, wrap(participateFn));
router.post('/:id/candidates/participate', requireAuth, wrap(participateFn));

// Cast vote (authenticated voters/candidates)
router.post('/:id/vote', requireAuth, wrap(castVote));

// Get results — admin only
router.get('/:id/results', adminAuth, wrap(resultsFn));

export default router;
