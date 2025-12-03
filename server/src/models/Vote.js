// server/src/models/Vote.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const VoteSchema = new Schema(
  {
    electionId: { type: Schema.Types.ObjectId, ref: "Election", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },

    // Allow either a reference to a User document OR an external voter code.
    // voterId is optional now (may be null), but prefer storing it when available.
    voterId: { type: Schema.Types.ObjectId, ref: "User", required: false },

    // Keep the external voter code (like "VOTER0003") for auditing when we couldn't resolve user._id
    voterCode: { type: String, required: false },

    // Optional metadata
    ipAddress: { type: String, required: false },
    userAgent: { type: String, required: false },

    createdAt: { type: Date, default: () => new Date(), required: true },
  },
  {
    versionKey: false,
    timestamps: false,
    strict: true,
  }
);

export default mongoose.models.Vote || mongoose.model("Vote", VoteSchema);
