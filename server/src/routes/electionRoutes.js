// server/src/routes/electionRoutes.js (or wherever you define /api/elections routes)
import express from "express";
import { getElectionVotes } from "../controllers/adminController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// ... other election routes

// Admin-only results route — keep the same path your frontend calls
router.get("/:id/results", adminAuth, getElectionVotes);

export default router;
