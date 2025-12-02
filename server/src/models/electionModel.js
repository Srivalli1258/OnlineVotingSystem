// models/electionModel.js
import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  party: { type: String },
  manifesto: { type: String },
  schemes: [{ type: String }], // list of schemes/policies candidate promises
  appliedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'accepted' } // accepted by default if eligible
});

const ElectionSchema = new mongoose.Schema({
  title: String,
  date: Date,
  // ... other fields ...
  candidates: [CandidateSchema]
});

export default mongoose.model('Election', ElectionSchema);
