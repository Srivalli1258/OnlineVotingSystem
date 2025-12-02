// updateAdminPassword.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from './src/models/Admin.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/votingdb';
const empId = 'EMP001';
const newPlain = 'Admin123';
const SALT_ROUNDS = 10;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const admin = await Admin.findOne({ employeeId: empId });
    if (!admin) {
      console.log('Admin not found for', empId);
      process.exit(1);
    }
    const newHash = await bcrypt.hash(newPlain, SALT_ROUNDS);
    admin.passwordHash = newHash;
    await admin.save();
    console.log('Updated passwordHash for', empId);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
