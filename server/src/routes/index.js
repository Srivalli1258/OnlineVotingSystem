 import express from 'express';
 import authRoutes from './auth.js';
 import electionRoutes from './elections.js';
 const router = express.Router();
router.use('/auth', authRoutes);
 router.use('/elections', electionRoutes);
 export default router;