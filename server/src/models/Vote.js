// server/src/models/Vote.js
import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  voterId: { type: String, required: true }, // matches AllowedVoter.voterId
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

export default mongoose.model("Vote", VoteSchema);
