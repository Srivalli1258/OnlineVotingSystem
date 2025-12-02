// server/src/models/Admin.js
import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Admin', AdminSchema);
