// server/src/models/Candidate.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const CandidateSchema = new Schema({
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  party: { type: String, default: '' },
  schemes: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // store participate form answers (key-value)
  eligibilityData: { type: Schema.Types.Mixed, default: {} },
    symbol: { type: String, default: '' },    // e.g. text or a URL to the symbol image
  manifesto: { type: String, default: '' },

  // whether candidate is auto-approved / eligible
  approved: { type: Boolean, default: true },
  createdAt: { type: Date, default: () => new Date() },
});

export default mongoose.model('Candidate', CandidateSchema);
