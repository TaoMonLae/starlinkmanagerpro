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

function serialize(receivable) {
  return {
    ...receivable,
    amount: Number(receivable.amount),
    amountReceived: Number(receivable.amountReceived),
    outstanding: Math.max(Number(receivable.amount) - Number(receivable.amountReceived), 0),
    currency: receivable.account?.currency || "MYR"
  };
}

function resolveStatus(amount, amountReceived, requestedStatus) {
  if (requestedStatus === "WAIVED") return "WAIVED";
  if (amountReceived >= amount) return "PAID";
  if (amountReceived > 0) return "PARTIAL";
  return requestedStatus || "OPEN";
}

async function normalizeReceivable(data, userId) {
  let accountId = data.accountId || null;
  let paymentId = data.paymentId || null;
  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    accountId = account ? account.id : null;
  }
  if (paymentId) {
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, account: { userId } } });
    paymentId = payment ? payment.id : null;
  }
  return {
    accountId,
    paymentId,
    debtorName: String(data.debtorName || "").trim(),
    debtorContact: data.debtorContact ? String(data.debtorContact).trim() : null,
    description: String(data.description || "").trim(),
    amount: Number(data.amount || 0),
    amountReceived: Number(data.amountReceived || 0),
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    notes: data.notes ? String(data.notes) : null
  };
}

export async function listReceivables(req, res) {
  const { status = "", q = "" } = req.query;
  const [receivables, rateData] = await Promise.all([
    prisma.receivable.findMany({
      where: {
        AND: [
          { userId: req.user.id },
          status ? { status } : {},
          q
            ? {
                OR: [
                  { debtorName: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                  { account: { accountName: { contains: q, mode: "insensitive" } } }
                ]
              }
            : {}
        ]
      },
      include: { account: true, payment: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
    }),
    getExchangeRates("USD")
  ]);
  res.json({ receivables: receivables.map(serialize), summary: summarize(receivables, rateData.rates) });
}

export async function createReceivable(req, res) {
  const data = await normalizeReceivable(req.body, req.user.id);
  const status = resolveStatus(data.amount, data.amountReceived, req.body.status);
  const receivable = await prisma.receivable.create({ data: { ...data, userId: req.user.id, status }, include: { account: true, payment: true } });
  await logActivity({ userId: req.user.id, type: "RECEIVABLE", message: `Added receivable from ${receivable.debtorName}` });
  res.status(201).json({ receivable: serialize(receivable) });
}

export async function updateReceivable(req, res) {
  const existing = await prisma.receivable.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "Receivable not found" });
  const data = await normalizeReceivable(req.body, req.user.id);
  const status = resolveStatus(data.amount, data.amountReceived, req.body.status);
  const receivable = await prisma.receivable.update({
    where: { id: existing.id },
    data: { ...data, status },
    include: { account: true, payment: true }
  });
  await logActivity({ userId: req.user.id, type: "RECEIVABLE", message: `Updated receivable from ${receivable.debtorName}` });
  res.json({ receivable: serialize(receivable) });
}

export async function deleteReceivable(req, res) {
  const existing = await prisma.receivable.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: "Receivable not found" });
  const receivable = await prisma.receivable.delete({ where: { id: existing.id } });
  await logActivity({ userId: req.user.id, type: "RECEIVABLE", message: `Deleted receivable from ${receivable.debtorName}` });
  res.status(204).send();
}

export async function recordReceived(req, res) {
  const current = await prisma.receivable.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!current) return res.status(404).json({ message: "Receivable not found" });
  const amountReceived = Number(current.amountReceived) + Number(req.body.amount);
  const receivable = await prisma.receivable.update({
    where: { id: current.id },
    data: {
      amountReceived,
      status: resolveStatus(Number(current.amount), amountReceived),
      notes: req.body.notes ? `${current.notes || ""}\nReceived ${req.body.amount}: ${req.body.notes}`.trim() : current.notes
    },
    include: { account: true, payment: true }
  });
  await logActivity({ userId: req.user.id, type: "RECEIVABLE", message: `Recorded received amount from ${receivable.debtorName}` });
  res.json({ receivable: serialize(receivable) });
}

export function summarize(receivables, rates = null) {
  return receivables.reduce(
    (summary, item) => {
      const sourceCurrency = item.account?.currency || "MYR";
      const amount = Number(item.amount);
      const received = Number(item.amountReceived);
      const outstanding = Math.max(amount - received, 0);
      summary.total += toUsd(amount, sourceCurrency, rates);
      summary.received += toUsd(received, sourceCurrency, rates);
      summary.outstanding += item.status === "WAIVED" ? 0 : toUsd(outstanding, sourceCurrency, rates);
      if (item.status === "OPEN") summary.open += 1;
      if (item.status === "PARTIAL") summary.partial += 1;
      if (item.status === "PAID") summary.paid += 1;
      if (item.status === "WAIVED") summary.waived += 1;
      return summary;
    },
    { total: 0, received: 0, outstanding: 0, open: 0, partial: 0, paid: 0, waived: 0 }
  );
}
