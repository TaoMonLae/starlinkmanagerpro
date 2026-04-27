import { Router } from "express";
import { exportPaymentsCsv, exportReceivablesPdf, monthlyReport, reports } from "../controllers/reportController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportRoutes = Router();
reportRoutes.use(requireAuth);
reportRoutes.get("/", asyncHandler(reports));
reportRoutes.get("/monthly", asyncHandler(monthlyReport));
reportRoutes.get("/export.csv", asyncHandler(exportPaymentsCsv));
reportRoutes.get("/receivables.pdf", asyncHandler(exportReceivablesPdf));
