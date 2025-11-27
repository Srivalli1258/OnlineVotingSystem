import mongoose from "mongoose";

export default async function connectDB(uri) {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(uri, {
      dbName: "votingdb",
      serverSelectionTimeoutMS: 10000, // 10s timeout (prevents long freeze)
    });

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);

    // DO NOT exit immediately → keeps server alive until fixed
    console.log("Retrying in 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return connectDB(uri);
  }
}
