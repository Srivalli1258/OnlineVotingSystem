// server/src/routes/index.js
import express from 'express';
import adminLogin from './adminLogin.js';   // <- update to the renamed file
import adminPanel from './adminPanel.js';
import elections from './elections.js';
import auth from './auth.js';
 import contactRoute from "./contactRoute.js";

import mongoose from "mongoose";
const router = express.Router();

router.use((req, res, next) => { console.log('[ROUTE]', req.method, req.originalUrl); next(); });

router.use('/auth', auth);               // /api/auth/...
router.use('/admin', adminLogin);   // /api/admin/login
router.use('/admin', adminPanel);   // /api/admin-panel/...
router.use('/elections', elections);     
router.use("/contact", contactRoute);

router.get("/debug/allowedvoters", async (req, res) => {
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



export default router;


