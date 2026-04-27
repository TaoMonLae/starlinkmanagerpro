import { Router } from "express";
import { changePassword, login, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/security.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema, passwordSchema, registerSchema, validate } from "../utils/validators.js";

export const authRoutes = Router();
authRoutes.post("/login", loginLimiter, validate(loginSchema), asyncHandler(login));
authRoutes.post("/register", loginLimiter, validate(registerSchema), asyncHandler(register));
authRoutes.get("/me", requireAuth, asyncHandler(me));
authRoutes.post("/change-password", requireAuth, validate(passwordSchema), asyncHandler(changePassword));
