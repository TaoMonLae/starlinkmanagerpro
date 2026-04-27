import { prisma } from "../config/prisma.js";
import { logActivity } from "../services/activityService.js";
import { getExchangeRates } from "../services/exchangeRateService.js";

function toUsd(value, sourceCurrency, rates) {
  const amount = Number(value || 0);
  if (sourceCurrency === "USD" || !rates) return amount;
  const rate = Number(rates[sourceCurrency]);
  if (!Number.isFinite(rate) || rate === 0) return amount;
  return amount / rate;
}

function serializeOwner(owner, rates = null) {
  const accounts = owner.accounts || [];
  const monthlyTotal = accounts.reduce(
    (sum, account) => sum + toUsd(Number(account.monthlyCost || 0), account.currency || "MYR", rates),
    0
  );
  return { ...owner, accountCount: accounts.length, monthlyTotal };
}

export async function listOwners(req, res) {
  const { q = "" } = req.query;
  const [owners, rateData] = await Promise.all([
    prisma.managedOwner.findMany({
      where: q
        ? {
            userId: req.user.id,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { contact: { contains: q, mode: "insensitive" } }
            ]
          }
        : { userId: req.user.id },
      include: { accounts: true },
      orderBy: { name: "asc" }
    }),
    getExchangeRates("USD")
  ]);
  res.json({ owners: owners.map((o) => serializeOwner(o, rateData.rates)) });
}

export async function createOwner(req, res) {
  const owner = await prisma.managedOwner.create({ data: { ...normalizeOwner(req.body), userId: req.user.id }, include: { accounts: true } });
  await logActivity({ userId: req.user.id, type: "OWNER", message: `Created managed owner ${owner.name}` });
  res.status(201).json({ owner: serializeOwner(owner) });
}

export async function updateOwner(req, res) {
  const existing = await prisma.managedOwner.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "Owner not found" });
  const owner = await prisma.managedOwner.update({
    where: { id: existing.id },
    data: normalizeOwner(req.body),
    include: { accounts: true }
  });
  await logActivity({ userId: req.user.id, type: "OWNER", message: `Updated managed owner ${owner.name}` });
  res.json({ owner: serializeOwner(owner) });
}

export async function deleteOwner(req, res) {
  const existing = await prisma.managedOwner.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "Owner not found" });
  const owner = await prisma.managedOwner.delete({ where: { id: existing.id } });
  await logActivity({ userId: req.user.id, type: "OWNER", message: `Deleted managed owner ${owner.name}` });
  res.status(204).send();
}

function normalizeOwner(data) {
  return {
    name: String(data.name || "").trim(),
    contact: data.contact ? String(data.contact).trim() : null,
    email: data.email ? String(data.email).trim() : null,
    phone: data.phone ? String(data.phone).trim() : null,
    notes: data.notes ? String(data.notes) : null
  };
}
