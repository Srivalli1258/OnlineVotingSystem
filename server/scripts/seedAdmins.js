// server/scripts/seedAdmins.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../src/models/Admin.js"; // adjust path if different
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://tontasrivalli_db_user:Srivalli%4027@cluster0.mbp4ect.mongodb.net/votingdb?retryWrites=true&w=majority";

const SALT_ROUNDS = 10;

// Admins you want to ensure exist
const ADMINS = [
  { employeeId: "EMP001", name: "Admin One", password: "Admin123" },
  { employeeId: "EMP002", name: "Admin Two", password: "Admin456" }
];

async function seed() {
  try {
    console.log("Seeder connecting to:", MONGO_URI);
    await mongoose.connect(MONGO_URI, {});

    for (const a of ADMINS) {
      const existing = await Admin.findOne({ employeeId: a.employeeId }).lean();
      if (existing) {
        console.log(`Admin ${a.employeeId} already exists — skipping creation.`);
        continue;
      }
      const passwordHash = await bcrypt.hash(a.password, SALT_ROUNDS);
      await Admin.create({
        employeeId: a.employeeId,
        name: a.name,
        passwordHash,
        createdAt: new Date()
      });
      console.log(`Created admin ${a.employeeId}`);
    }

    console.log("Seeding finished.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

export default seed;
