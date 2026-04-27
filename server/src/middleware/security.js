import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export const corsMiddleware = cors({
  origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:8115"],
  credentials: true
});

export const helmetMiddleware = helmet();

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." }
});
