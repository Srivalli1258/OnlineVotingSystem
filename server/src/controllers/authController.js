 import User from '../models/User.js';
 import bcrypt from 'bcrypt';
 import jwt from 'jsonwebtoken';
 const SALT_ROUNDS = 10;
 const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
 const JWT_EXPIRES = '6h';
 export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields'
 });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ name, email, passwordHash, role: role || 'voter' });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn:
 JWT_EXPIRES });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email,
 role: user.role } });
  } catch (err) {
    next(err);
  }
 }
 export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn:
 JWT_EXPIRES });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role
 } });
  } catch (err) {
    next(err);
  }
 }