// server/scripts/seedAllowedVoters.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import AllowedVoter from "../src/models/AllowedVoter.js";

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/votingdb";

async function seed() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to", MONGO);

  const toInsert = [];
  for (let i = 1; i <= 100; i++) {
    const voterId = `VOTER${String(i).padStart(4, "0")}`;
    const pin = String(1000 + i); // e.g. 1001..1100
    toInsert.push({ voterId, pin, voted: false });
  }

  for (const v of toInsert) {
    await AllowedVoter.updateOne({ voterId: v.voterId }, { $setOnInsert: v }, { upsert: true });
  }

  console.log("Seed complete: 100 allowed voters created/ensured.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
