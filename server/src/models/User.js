import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },

  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  idNumber: { type: String, required: true },

  idProof: {
    filename: { type: String },
    originalname: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    path: { type: String }
  },

  role: { type: String, enum: ["admin", "voter"], default: "voter" },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
