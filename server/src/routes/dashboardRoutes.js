import { Router } from "express";
import { dashboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardRoutes = Router();
dashboardRoutes.get("/", requireAuth, asyncHandler(dashboard));
