import { Router } from "express";
import { accountRoutes } from "./accountRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { dashboardRoutes } from "./dashboardRoutes.js";
import { importRoutes } from "./importRoutes.js";
import { ownerRoutes } from "./ownerRoutes.js";
import { paymentRoutes } from "./paymentRoutes.js";
import { reportRoutes } from "./reportRoutes.js";
import { receivableRoutes } from "./receivableRoutes.js";
import { settingsRoutes } from "./settingsRoutes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (req, res) => res.json({ ok: true, name: "Starlink Manager Pro" }));
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/accounts", accountRoutes);
apiRoutes.use("/owners", ownerRoutes);
apiRoutes.use("/payments", paymentRoutes);
apiRoutes.use("/dashboard", dashboardRoutes);
apiRoutes.use("/reports", reportRoutes);
apiRoutes.use("/receivables", receivableRoutes);
apiRoutes.use("/import", importRoutes);
apiRoutes.use("/settings", settingsRoutes);
