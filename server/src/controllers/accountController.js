import { prisma } from "../config/prisma.js";
import { logActivity } from "../services/activityService.js";
import { accountBillingState } from "../utils/billing.js";

function serializeAccount(account) {
  return {
    ...account,
    monthlyCost: Number(account.monthlyCost),
    billing: accountBillingState(account, account.payments || [])
  };
}

export async function listAccounts(req, res) {
  const { q = "", status = "" } = req.query;
  const accounts = await prisma.account.findMany({
    where: {
      AND: [
        status ? { status } : {},
        { userId: req.user.id },
        q
          ? {
              OR: [
                { accountName: { contains: q, mode: "insensitive" } },
                { gmailEmail: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } }
              ]
            }
          : {}
      ]
    },
    include: { owner: true, payments: { orderBy: { date: "desc" } } },
    orderBy: { accountName: "asc" }
  });
  res.json({ accounts: accounts.map(serializeAccount) });
}

export async function getAccount(req, res) {
  const account = await prisma.account.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { owner: true, payments: { orderBy: { date: "desc" } } }
  });
  if (!account) return res.status(404).json({ message: "Account not found" });
  res.json({ account: serializeAccount(account) });
}

export async function createAccount(req, res) {
  const data = await normalizeAccount(req.body, req.user.id);
  const account = await prisma.account.create({ data: { ...data, userId: req.user.id }, include: { owner: true, payments: true } });
  await logActivity({ userId: req.user.id, type: "ACCOUNT", message: `Created account ${account.accountName}` });
  res.status(201).json({ account: serializeAccount(account) });
}

export async function updateAccount(req, res) {
  const existing = await prisma.account.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "Account not found" });
  const account = await prisma.account.update({
    where: { id: existing.id },
    data: await normalizeAccount(req.body, req.user.id),
    include: { owner: true, payments: { orderBy: { date: "desc" } } }
  });
  await logActivity({ userId: req.user.id, type: "ACCOUNT", message: `Updated account ${account.accountName}` });
  res.json({ account: serializeAccount(account) });
}

export async function deleteAccount(req, res) {
  const existing = await prisma.account.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "Account not found" });
  const account = await prisma.account.delete({ where: { id: existing.id } });
  await logActivity({ userId: req.user.id, type: "ACCOUNT", message: `Deleted account ${account.accountName}` });
  res.status(204).send();
}

async function normalizeAccount(data, userId) {
  const billingDate = data.billingDate ? new Date(data.billingDate) : null;
  const billingDateDay = billingDate && !Number.isNaN(billingDate.getTime()) ? billingDate.getUTCDate() : null;
  const billingDay = Math.min(Math.max(Number(billingDateDay || data.billingDay || 1), 1), 28);

  let ownerId = data.ownerId || null;
  if (ownerId) {
    const owner = await prisma.managedOwner.findFirst({ where: { id: ownerId, userId } });
    ownerId = owner ? owner.id : null;
  }

  return {
    accountName: String(data.accountName || "").trim(),
    gmailEmail: String(data.gmailEmail || "").trim().toLowerCase(),
    location: String(data.location || "").trim(),
    monthlyCost: Number(data.monthlyCost || 0),
    currency: ["USD", "SGD", "MYR", "MMK"].includes(data.currency) ? data.currency : "MYR",
    billingDate,
    billingDay,
    status: ["ACTIVE", "SUSPENDED", "BACKUP", "CANCELLED"].includes(data.status) ? data.status : "ACTIVE",
    notes: data.notes ? String(data.notes) : null,
    ownerId
  };
}
