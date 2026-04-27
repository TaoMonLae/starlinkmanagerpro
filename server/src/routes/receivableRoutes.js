import { Router } from "express";
import { createReceivable, deleteReceivable, listReceivables, recordReceived, updateReceivable } from "../controllers/receivableController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { receivableReceiveSchema, receivableSchema, validate } from "../utils/validators.js";

export const receivableRoutes = Router();
receivableRoutes.use(requireAuth);
receivableRoutes.get("/", asyncHandler(listReceivables));
receivableRoutes.post("/", validate(receivableSchema), asyncHandler(createReceivable));
receivableRoutes.put("/:id", validate(receivableSchema), asyncHandler(updateReceivable));
receivableRoutes.post("/:id/receive", validate(receivableReceiveSchema), asyncHandler(recordReceived));
receivableRoutes.delete("/:id", asyncHandler(deleteReceivable));
