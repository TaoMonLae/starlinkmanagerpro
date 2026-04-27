import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { logActivity } from "../services/activityService.js";

const defaultBrandName = "Starlink Manager Pro";

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "12h" });
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    settings: {
      theme: user.settings?.theme || "system",
      currency: user.settings?.currency || "MYR",
      inactivityMs: user.settings?.inactivityMs || 1800000,
      appName: user.settings?.appName || defaultBrandName,
      logoDataUrl: user.settings?.logoDataUrl || null
    }
  };
}

export async function login(req, res) {
  const email = req.body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, include: { settings: true } });
  if (!user) return res.status(401).json({ message: "Invalid email or password" });

  const ok = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid email or password" });

  await logActivity({ userId: user.id, type: "AUTH", message: "Signed in" });
  res.json({ token: signToken(user), user: serializeUser(user) });
}

export async function register(req, res) {
  const email = req.body.email.toLowerCase();
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await prisma.user.create({
    data: {
      name: String(req.body.name).trim(),
      email,
      passwordHash,
      settings: { create: { theme: "system", currency: "MYR", inactivityMs: 1800000, appName: defaultBrandName } }
    },
    include: { settings: true }
  });
  await logActivity({ userId: user.id, type: "AUTH", message: "Created account" });
  res.status(201).json({ token: signToken(user), user: serializeUser(user) });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { settings: true } });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: serializeUser(user) });
}

export async function changePassword(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

  const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logActivity({ userId: user.id, type: "AUTH", message: "Changed password" });
  res.status(204).send();
}
