// server/src/models/Candidate.js
import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  name: { type: String, required: true },         // display name
  fullName: { type: String },                     // optional duplicate
  aadhaar: { type: String, index: true, sparse: true }, // 12-digit ID, optional but used to dedupe
  address: { type: String },
  party: { type: String, default: '' },
  manifesto: { type: String, default: '' },
  symbol: { type: String, default: '' },
  schemes: [{ type: String }], // keep as simple strings (you may store scheme IDs instead)
  age: { type: Number },
  idProofProvided: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Candidate', CandidateSchema);
