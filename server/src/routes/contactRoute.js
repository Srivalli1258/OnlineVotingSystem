import express from "express";
import Contact from "../models/contactModel.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMsg = await Contact.create({ name, email, message });

    res.status(201).json({
      message: "Message saved successfully",
      data: newMsg,
    });
  } catch (error) {
    console.error("CONTACT ROUTE ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;   // <-- REQUIRED