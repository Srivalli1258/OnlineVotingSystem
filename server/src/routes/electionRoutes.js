// server/src/routes/electionRoutes.js
import express from "express";
import { getElectionResultsDetailed } from "../controllers/electionResultsController.js";
import adminAuth from "../middleware/adminAuth.js"; // your admin middleware
// Ensure this router is mounted at "/api/elections"

const router = express.Router();

// ... other election routes

// GET election results (admin only)
router.get("/:id/results", adminAuth, getElectionResultsDetailed);

export default router;
