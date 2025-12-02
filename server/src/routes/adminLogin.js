// server/src/routes/AdminLogin.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES = '7d';

// Remove SALT_ROUNDS from login file — only used when creating/hashing passwords.
// const SALT_ROUNDS = 10;

router.post('/login', async (req, res) => {
  try {
    console.log('=== ADMIN LOGIN ATTEMPT ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Content-Type header:', req.headers['content-type']);

    const { employeeId, password } = req.body || {};

    if (!employeeId || !password) {
      console.log('ADMIN: missing fields ->', { employeeId, passwordPresent: !!password });
      return res.status(400).json({ message: 'employeeId and password required' });
    }

    const emp = String(employeeId).trim();

    // If your Admin schema hides passwordHash by default (select: false),
    // use .select('+passwordHash') here to ensure it's returned.
    const admin = await Admin.findOne({ employeeId: emp });
    console.log('DB lookup result:', admin ? { id: admin._id.toString(), employeeId: admin.employeeId } : null);

    if (!admin) {
      console.log('ADMIN: not found in DB for employeeId=', emp);
      return res.status(401).json({ message: 'Invalid credentials' }); // generic message
    }

    // CORRECT: compare the plain password with the stored hash
    const ok = await bcrypt.compare(password, admin.passwordHash);
        console.log('bcrypt.compare result:', ok);

    if (!ok) {
      console.log('ADMIN: password mismatch for', emp);
      return res.status(401).json({ message: 'Inv credentials' });
    }

    const token = jwt.sign(
      { adminId: admin._id.toString(), employeeId: admin.employeeId, role: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log('ADMIN LOGIN SUCCESS:', admin.employeeId);
    return res.json({ token, admin: { _id: admin._id, employeeId: admin.employeeId, name: admin.name } });

  } catch (err) {
    console.error('ADMIN LOGIN ERROR', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
