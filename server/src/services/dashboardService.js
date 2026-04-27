import { prisma } from "../config/prisma.js";
import { accountBillingState } from "../utils/billing.js";
import { monthKey } from "../utils/dates.js";
import { getExchangeRates } from "./exchangeRateService.js";

function toUsd(value, sourceCurrency, rates) {
  const amount = Number(value || 0);
  if (sourceCurrency === "USD" || !rates) return amount;
  const rate = Number(rates[sourceCurrency]);
  if (!Number.isFinite(rate) || rate === 0) return amount;
  return amount / rate;
}

export async function getDashboardData(userId) {
  const [accounts, payments, receivables, recentActivity, rateData] = await Promise.all([
    prisma.account.findMany({ where: { userId }, include: { owner: true, payments: { orderBy: { date: "desc" } } }, orderBy: { accountName: "asc" } }),
    prisma.payment.findMany({ where: { account: { userId } }, include: { account: true }, orderBy: { date: "asc" } }),
    prisma.receivable.findMany({ where: { userId }, include: { account: true }, orderBy: { dueDate: "asc" } }),
    prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
    getExchangeRates("USD")
  ]);
  const rates = rateData.rates;

  const enriched = accounts.map((account) => ({
    ...account,
    monthlyCost: Number(account.monthlyCost),
    billing: accountBillingState(account, account.payments)
  }));

  const activeAccounts = enriched.filter((a) => a.status !== "CANCELLED");
  const managedForOthers = activeAccounts.filter((a) => a.ownerId).length;
  const monthlyTotalCost = activeAccounts.reduce((sum, a) => sum + toUsd(a.monthlyCost, a.currency, rates), 0);
  const paidAccounts = enriched.filter((a) => a.billing.paymentStatus === "paid").length;
  const dueSoon = enriched.filter((a) => a.billing.paymentStatus === "due_soon").length;
  const overdue = enriched.filter((a) => a.billing.paymentStatus === "overdue").length;
  const receivableOutstanding = receivables.reduce((sum, item) => {
    if (item.status === "WAIVED") return sum;
    const outstanding = Math.max(Number(item.amount) - Number(item.amountReceived), 0);
    return sum + toUsd(outstanding, item.account?.currency || "MYR", rates);
  }, 0);
  const receivableReceived = receivables.reduce(
    (sum, item) => sum + toUsd(Number(item.amountReceived), item.account?.currency || "MYR", rates),
    0
  );

  const spendingByMonth = payments.reduce((map, payment) => {
    const key = monthKey(payment.date);
    const usd = toUsd(Number(payment.amount), payment.account?.currency || "MYR", rates);
    map.set(key, (map.get(key) || 0) + usd);
    return map;
  }, new Map());

  const monthlySpending = Array.from(spendingByMonth.entries()).slice(-12).map(([month, amount]) => ({ month, amount }));

  return {
    kpis: {
      totalAccounts: accounts.length,
      monthlyTotalCost,
      paidAccounts,
      dueSoon,
      overdue,
      averageMonthlyCost: activeAccounts.length ? monthlyTotalCost / activeAccounts.length : 0,
      receivableOutstanding,
      receivableReceived,
      openReceivables: receivables.filter((item) => item.status === "OPEN" || item.status === "PARTIAL").length,
      managedForOthers,
      personalAccounts: activeAccounts.length - managedForOthers
    },
    monthlySpending,
    paymentStatus: [
      { name: "Paid", value: paidAccounts },
      { name: "Due Soon", value: dueSoon },
      { name: "Overdue", value: overdue },
      { name: "Upcoming", value: enriched.filter((a) => a.billing.paymentStatus === "upcoming").length }
    ],
    upcomingRenewals: enriched
      .filter((a) => a.status !== "CANCELLED")
      .sort((a, b) => a.billing.nextDueDate - b.billing.nextDueDate)
      .slice(0, 8),
    receivables: receivables
      .filter((item) => item.status === "OPEN" || item.status === "PARTIAL")
      .slice(0, 8)
      .map((item) => ({
        ...item,
        amount: Number(item.amount),
        amountReceived: Number(item.amountReceived),
        outstanding: Math.max(Number(item.amount) - Number(item.amountReceived), 0),
        currency: item.account?.currency || "MYR"
      })),
    recentActivity
  };
}
