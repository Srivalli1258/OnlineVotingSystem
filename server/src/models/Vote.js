 import mongoose from 'mongoose';
 const voteSchema = new mongoose.Schema({
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  castAt: { type: Date, default: Date.now }
 });
 voteSchema.index({ election: 1, voter: 1 }, { unique: true });
 export default mongoose.model('Vote', voteSchema)