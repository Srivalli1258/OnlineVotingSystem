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

// --- SECURITY FIRST ---
app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use(cookieParser());

// --- THEN BODY PARSERS (ONLY ONCE) ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---
app.use('/api', routes);

// --- ERROR HANDLER ---
app.use(errorHandler);

// --- MONGO CONNECT ---
let mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.warn("⚠️ MONGO_URI not found — using fallback");
  mongoURI = "mongodb+srv://tontasrivalli_db_user:Srivalli%4027@cluster0.mbp4ect.mongodb.net/votingdb?retryWrites=true&w=majority";
}

connectDB(mongoURI).then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
