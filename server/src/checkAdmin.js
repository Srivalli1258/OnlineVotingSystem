// checkAdmin.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Admin from './src/models/Admin.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/votingdb';

async function run() {
  await mongoose.connect(MONGO_URI);
  const a = await Admin.findOne({ employeeId: 'EMP001' }).lean();
  console.log('Found admin:', a ? { employeeId: a.employeeId, _id: a._id, hasPasswordHash: !!a.passwordHash } : null);
  if (a) console.log('passwordHash (first 60 chars):', (a.passwordHash || '').slice(0,60));
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
