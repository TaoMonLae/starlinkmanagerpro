import { prisma } from "../config/prisma.js";
import { accountBillingState, billingCycleDay } from "../utils/billing.js";
import { monthKey } from "../utils/dates.js";
import { getExchangeRates } from "./exchangeRateService.js";

function toUsd(value, sourceCurrency, rates) {
  const amount = Number(value || 0);
  if (sourceCurrency === "USD" || !rates) return amount;
  const rate = Number(rates[sourceCurrency]);
  if (!Number.isFinite(rate) || rate === 0) return amount;
  return amount / rate;
}

const ymKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export async function getMonthlyReportData(monthsBack = 12, userId) {
  const [accounts, payments, rateData] = await Promise.all([
    prisma.account.findMany({ where: { userId }, include: { payments: true }, orderBy: { accountName: "asc" } }),
    prisma.payment.findMany({ where: { account: { userId } }, include: { account: true }, orderBy: { date: "asc" } }),
    getExchangeRates("USD")
  ]);
  const rates = rateData.rates;

  const now = new Date();
  const buckets = [];
  for (let offset = monthsBack - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      month: ymKey(d),
      label: new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(d),
      monthDate: d,
      totalUsd: 0,
      paidAccounts: 0,
      overdueAccounts: 0,
      paymentCount: 0
    });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.month, b]));

  payments.forEach((p) => {
    const key = ymKey(p.date);
    const bucket = bucketByKey.get(key);
    if (!bucket) return;
    bucket.totalUsd += toUsd(Number(p.amount), p.account?.currency || "MYR", rates);
    bucket.paymentCount += 1;
  });

  accounts.forEach((account) => {
    const billingDay = billingCycleDay(account);
    const accountPaidMonths = new Set(account.payments.map((p) => ymKey(p.date)));
    const accountCreatedKey = account.createdAt ? ymKey(account.createdAt) : null;
    buckets.forEach((bucket) => {
      if (accountCreatedKey && bucket.month < accountCreatedKey) return;
      const cycleDue = new Date(bucket.monthDate.getFullYear(), bucket.monthDate.getMonth(), billingDay, 12, 0, 0);
      if (accountPaidMonths.has(bucket.month)) {
        bucket.paidAccounts += 1;
      } else if (now >= cycleDue) {
        bucket.overdueAccounts += 1;
      }
    });
  });

  return buckets.map(({ monthDate, ...rest }) => rest);
}

export async function getReportsData(userId) {
  const [accounts, payments, receivables, rateData] = await Promise.all([
    prisma.account.findMany({ where: { userId }, include: { owner: true, payments: true }, orderBy: { monthlyCost: "desc" } }),
    prisma.payment.findMany({ where: { account: { userId } }, include: { account: true }, orderBy: { date: "asc" } }),
    prisma.receivable.findMany({ where: { userId }, include: { account: true }, orderBy: { dueDate: "asc" } }),
    getExchangeRates("USD")
  ]);
  const rates = rateData.rates;

  const monthlyTrendMap = payments.reduce((map, payment) => {
    const key = monthKey(payment.date);
    const usd = toUsd(Number(payment.amount), payment.account?.currency || "MYR", rates);
    map.set(key, (map.get(key) || 0) + usd);
    return map;
  }, new Map());

  const yearlyMap = payments.reduce((map, payment) => {
    const year = new Date(payment.date).getFullYear().toString();
    const usd = toUsd(Number(payment.amount), payment.account?.currency || "MYR", rates);
    map.set(year, (map.get(year) || 0) + usd);
    return map;
  }, new Map());

  const accountStates = accounts.map((account) => ({
    ...account,
    monthlyCost: Number(account.monthlyCost),
    monthlyCostUsd: toUsd(Number(account.monthlyCost), account.currency, rates),
    billing: accountBillingState(account, account.payments)
  }));

  const topExpensive = [...accountStates]
    .sort((a, b) => b.monthlyCostUsd - a.monthlyCostUsd)
    .slice(0, 6);

  return {
    monthlySpendTrend: Array.from(monthlyTrendMap.entries()).map(([month, amount]) => ({ month, amount })),
    yearlyTotal: Array.from(yearlyMap.entries()).map(([year, amount]) => ({ year, amount })),
    topExpensiveAccounts: topExpensive,
    paidVsUnpaid: [
      { name: "Paid", value: accountStates.filter((a) => a.billing.paymentStatus === "paid").length },
      { name: "Unpaid", value: accountStates.filter((a) => a.billing.paymentStatus !== "paid").length }
    ],
    receivables: receivables.map((item) => ({
      ...item,
      amount: Number(item.amount),
      amountReceived: Number(item.amountReceived),
      outstanding: item.status === "WAIVED" ? 0 : Math.max(Number(item.amount) - Number(item.amountReceived), 0),
      currency: item.account?.currency || "MYR"
    })),
    receivableSummary: receivables.reduce(
      (summary, item) => {
        const amount = Number(item.amount);
        const received = Number(item.amountReceived);
        const sourceCurrency = item.account?.currency || "MYR";
        summary.total += toUsd(amount, sourceCurrency, rates);
        summary.received += toUsd(received, sourceCurrency, rates);
        summary.outstanding += item.status === "WAIVED" ? 0 : toUsd(Math.max(amount - received, 0), sourceCurrency, rates);
        return summary;
      },
      { total: 0, received: 0, outstanding: 0 }
    )
  };
}
