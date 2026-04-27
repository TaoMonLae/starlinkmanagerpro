import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ message: "Invalid session" });
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err) {
    console.warn("[auth] JWT verification failed:", err.name, err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

