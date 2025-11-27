// server/src/models/Election.js
import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  party: { type: String, default: '' },
  schemes: [{ type: String }],
  manifesto: { type: String, default: '' }, // optional
  symbol: { type: String, default: '' },    // optional
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const ElectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startAt: { type: Date },
  endAt: { type: Date },
  isPublic: { type: Boolean, default: true },
  allowedVoters: [{ type: String }],
  candidates: [CandidateSchema],
  // New field: rules for candidate participation
  candidateEligibility: { type: String, default: '' },
  // Optional: voter eligibility separate field (if you already have one)
  eligibility: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Election', ElectionSchema);
