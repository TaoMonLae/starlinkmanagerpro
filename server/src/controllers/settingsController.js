import { prisma } from "../config/prisma.js";
import { getExchangeRates } from "../services/exchangeRateService.js";
import { logActivity } from "../services/activityService.js";

const defaultBrandName = "Starlink Manager Pro";

const cleanAppName = (value) => {
  const name = String(value || defaultBrandName).trim().slice(0, 80);
  return name || defaultBrandName;
};

function serializeSettings(settings) {
  return {
    theme: settings?.theme || "system",
    currency: settings?.currency || "MYR",
    inactivityMs: settings?.inactivityMs || 1800000,
    appName: settings?.appName || defaultBrandName,
    logoDataUrl: settings?.logoDataUrl || null
  };
}

function serializeUser(user, settings) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    settings: serializeSettings(settings)
  };
}

async function ensureSettings(userId) {
  return prisma.settings.upsert({
    where: { userId },
    update: {},
    create: { userId, theme: "system", currency: "MYR", inactivityMs: 1800000, appName: defaultBrandName }
  });
}

export async function getSettings(req, res) {
  const settings = await ensureSettings(req.user.id);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user: serializeUser(user, settings) });
}

export async function updateSettings(req, res) {
  const settings = await prisma.settings.upsert({
    where: { userId: req.user.id },
    update: {
      theme: req.body.theme,
      currency: req.body.currency,
      inactivityMs: req.body.inactivityMs,
      appName: cleanAppName(req.body.appName)
    },
    create: {
      userId: req.user.id,
      theme: req.body.theme || "system",
      currency: req.body.currency || "MYR",
      inactivityMs: req.body.inactivityMs || 1800000,
      appName: cleanAppName(req.body.appName)
    }
  });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body.name ? { name: String(req.body.name).trim() } : {},
    include: { settings: true }
  });
  await logActivity({ userId: req.user.id, type: "SETTINGS", message: "Updated settings" });
  res.json({ user: serializeUser(user, settings) });
}

export async function uploadLogo(req, res) {
  if (!req.file) return res.status(400).json({ message: "No logo uploaded" });
  if (!["image/png", "image/jpeg"].includes(req.file.mimetype)) {
    return res.status(422).json({ message: "Logo must be a PNG or JPG image" });
  }

  const logoDataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const settings = await prisma.settings.upsert({
    where: { userId: req.user.id },
    update: { logoDataUrl },
    create: { userId: req.user.id, theme: "system", currency: "MYR", inactivityMs: 1800000, appName: defaultBrandName, logoDataUrl }
  });

  await logActivity({ userId: req.user.id, type: "SETTINGS", message: "Uploaded logo" });
  res.json({ settings: serializeSettings(settings) });
}

export async function getRates(req, res) {
  const base = req.query.base || "USD";
  res.json(await getExchangeRates(base));
}
