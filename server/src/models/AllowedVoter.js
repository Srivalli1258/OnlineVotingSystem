// server/src/models/AllowedVoter.js
import mongoose from "mongoose";

const AllowedVoterSchema = new mongoose.Schema({
  voterId: { type: String, required: true, unique: true }, // e.g. VOTER0001
  pin: { type: String, required: true },                   // store as string "1234"
  voted: { type: Boolean, default: false },
  votedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("AllowedVoter", AllowedVoterSchema);
