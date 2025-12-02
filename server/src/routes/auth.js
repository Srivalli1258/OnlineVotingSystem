// server/src/routes/auth.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// uploads directory (ensure same behaviour as rest of project)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + path.extname(file.originalname))
});
const upload = multer({ storage });

// public register (multipart/form-data because idProof file)
router.post('/register', upload.single('idProof'), register);

// public login
router.post('/login', login);

export default router;
