 import mongoose from 'mongoose';
 const electionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startAt: Date,
  endAt: Date,
  isPublic: { type: Boolean, default: true },
  allowedVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
 });

  export default mongoose.model('Election', electionSchema);