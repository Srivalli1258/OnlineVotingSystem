 import mongoose from 'mongoose';
 const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'candidate', 'voter'], default: 'voter' },
  createdAt: { type: Date, default: Date.now }
 });
 export default mongoose.model('User', userSchema)