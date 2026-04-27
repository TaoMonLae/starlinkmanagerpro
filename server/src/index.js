import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { prisma } from "./config/prisma.js";
import { corsMiddleware, helmetMiddleware } from "./middleware/security.js";
import { apiRoutes } from "./routes/index.js";

const app = express();
const port = process.env.PORT || 8112;

app.set("trust proxy", 1);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", apiRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  if (err.code === "P2002") return res.status(409).json({ message: "Record already exists" });
  if (err.code === "P2025") return res.status(404).json({ message: "Record not found" });
  if (err.name === "PrismaClientInitializationError") {
    return res.status(503).json({ message: "Database connection failed. Check DATABASE_URL, permissions, migrations and seed data." });
  }
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Starlink Manager Pro API running on :${port}`);
});
