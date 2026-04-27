import { Router } from "express";
import multer from "multer";
import { getRates, getSettings, updateSettings, uploadLogo } from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { settingsSchema, validate } from "../utils/validators.js";

export const settingsRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

settingsRoutes.use(requireAuth);
settingsRoutes.get("/", asyncHandler(getSettings));
settingsRoutes.put("/", validate(settingsSchema), asyncHandler(updateSettings));
settingsRoutes.post("/logo", upload.single("logo"), asyncHandler(uploadLogo));
settingsRoutes.get("/rates", asyncHandler(getRates));
