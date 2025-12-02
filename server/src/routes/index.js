// server/src/routes/index.js
import express from 'express';
import adminLogin from './adminLogin.js';   // <- update to the renamed file
import adminPanel from './adminPanel.js';
import elections from './elections.js';
import auth from './auth.js';
 import contactRoute from "./contactRoute.js";


const router = express.Router();

router.use((req, res, next) => { console.log('[ROUTE]', req.method, req.originalUrl); next(); });

router.use('/auth', auth);               // /api/auth/...
router.use('/admin', adminLogin);   // /api/admin/login
router.use('/admin', adminPanel);   // /api/admin-panel/...
router.use('/elections', elections);     
router.use("/contact", contactRoute);



export default router;
