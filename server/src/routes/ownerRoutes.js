import { Router } from "express";
import { createOwner, deleteOwner, listOwners, updateOwner } from "../controllers/ownerController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ownerSchema, validate } from "../utils/validators.js";

export const ownerRoutes = Router();
ownerRoutes.use(requireAuth);
ownerRoutes.get("/", asyncHandler(listOwners));
ownerRoutes.post("/", validate(ownerSchema), asyncHandler(createOwner));
ownerRoutes.put("/:id", validate(ownerSchema), asyncHandler(updateOwner));
ownerRoutes.delete("/:id", asyncHandler(deleteOwner));
