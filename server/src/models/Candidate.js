import mongoose from 'mongoose';
 const candidateSchema = new mongoose.Schema({
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  name: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
 });
 export default mongoose.model('Candidate', candidateSchema);