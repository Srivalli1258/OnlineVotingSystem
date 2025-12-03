import mongoose from "mongoose";

app.get("/debug/allowedvoters", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const coll = db.collection("allowedvoters");

    const docs = await coll.find().limit(10).toArray();

    res.json({
      message: "Sample documents from allowedvoters",
      docs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
