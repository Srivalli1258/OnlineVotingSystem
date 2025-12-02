// server/src/middleware/adminAuth.js
import jwt from 'jsonwebtoken';

export function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      console.warn('adminAuth: missing or malformed Authorization header', header);
      return res.status(401).json({ message: 'No admin token' });
    }
    const token = header.split(' ')[1];

    try {
      // verify token and log payload for debugging
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      console.log('adminAuth: verified token payload:', { sub: payload.adminId || payload.id, role: payload.role, employeeId: payload.employeeId });
      if (payload.role !== 'admin') {
        console.warn('adminAuth: token role not admin', payload.role);
        return res.status(403).json({ message: 'Not an admin' });
      }
      req.admin = payload;
      return next();
    } catch (err) {
      console.error('adminAuth: verify error ->', err && err.message);
      console.error('adminAuth: token snippet ->', token ? token.slice(0,60) + '...' : 'NO_TOKEN');
      return res.status(401).json({ message: 'Invalid admin token' });
    }
  } catch (err) {
    console.error('adminAuth: unexpected error', err);
    return res.status(401).json({ message: 'Invalid admin token' });
  }
}
