// server/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

/**
 * requireAuth - verifies Bearer token and attaches req.user (user doc without passwordHash)
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization required' });
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // payload should contain id (from your login) — adjust key if you sign with different key name
    const id = payload.id || payload.userId || payload.userId || payload.uid || payload.id;
    if (!id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(id).select('-passwordHash').lean();
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });

    req.user = user;
    next();
  } catch (err) {
    // token parse errors, expired tokens, etc.
    return res.status(401).json({ message: 'Unauthorized', error: err?.message });
  }
}
