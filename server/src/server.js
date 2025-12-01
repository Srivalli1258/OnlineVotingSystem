import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// ROUTES
app.use('/api', routes);
app.use(errorHandler);
// --- FIXED MONGO URI LOADING --- //
let mongoURI = process.env.MONGO_URI;

// FALLBACK (if env missing)
if (!mongoURI) {
  console.warn("⚠️ WARNING: MONGO_URI not found in .env — using fallback SRV URI.");

  mongoURI = "mongodb+srv://tontasrivalli_db_user:Srivalli%4027@cluster0.mbp4ect.mongodb.net/votingdb?retryWrites=true&w=majority";
}

// CONNECT → THEN START SERVER
connectDB(mongoURI).then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
});
