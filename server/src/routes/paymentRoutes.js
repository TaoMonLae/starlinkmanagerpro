import { Router } from "express";
import { createPayment, getPaymentReceipt, listPayments, markPaid } from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paymentSchema, validate } from "../utils/validators.js";

export const paymentRoutes = Router();
paymentRoutes.use(requireAuth);
paymentRoutes.get("/", asyncHandler(listPayments));
paymentRoutes.post("/", validate(paymentSchema), asyncHandler(createPayment));
paymentRoutes.post("/mark-paid/:accountId", asyncHandler(markPaid));
paymentRoutes.get("/:id/receipt.pdf", asyncHandler(getPaymentReceipt));
