import { Router } from "express";
import multer from "multer";
import { importAccounts } from "../controllers/importController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const importRoutes = Router();
importRoutes.post("/", requireAuth, upload.single("file"), asyncHandler(importAccounts));
