import mongoose from "mongoose";

const AllowedVoterSchema = new mongoose.Schema({
  // electionId omitted because voters are global across elections
  voterId: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: String,
    required: true
  },
  voted: {
    type: Boolean,
    default: false
  },
  votedAt: {
    type: Date
  }
});

// unique on voterId globally (optional)
AllowedVoterSchema.index({ voterId: 1 }, { unique: true });

export default mongoose.model("AllowedVoter", AllowedVoterSchema);
