import { Router } from "express";
import { createAccount, deleteAccount, getAccount, listAccounts, updateAccount } from "../controllers/accountController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { accountSchema, validate } from "../utils/validators.js";

export const accountRoutes = Router();
accountRoutes.use(requireAuth);
accountRoutes.get("/", asyncHandler(listAccounts));
accountRoutes.post("/", validate(accountSchema), asyncHandler(createAccount));
accountRoutes.get("/:id", asyncHandler(getAccount));
accountRoutes.put("/:id", validate(accountSchema), asyncHandler(updateAccount));
accountRoutes.delete("/:id", asyncHandler(deleteAccount));
