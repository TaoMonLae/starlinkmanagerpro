import { daysUntil, monthRange } from "./dates.js";

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const billingCycleDay = (account) => {
  const sourceDate = account.billingDate ? new Date(account.billingDate) : null;
  const dateDay = sourceDate && !Number.isNaN(sourceDate.getTime()) ? sourceDate.getUTCDate() : null;
  return Math.min(Math.max(Number(dateDay || account.billingDay || 1), 1), 28);
};

export function accountBillingState(account, payments = []) {
  const { start } = monthRange(0);
  const billingDay = billingCycleDay(account);
  const currentCycleDueDate = new Date(start.getFullYear(), start.getMonth(), billingDay, 12, 0, 0);
  const nextCycleDueDate = new Date(start.getFullYear(), start.getMonth() + 1, billingDay, 12, 0, 0);

  const paidMonths = new Set(payments.map((p) => monthKey(p.date)));
  const monthsPaid = paidMonths.size;
  const paidThisMonth = paidMonths.has(monthKey(start));

  const now = new Date();
  const createdAt = account.createdAt ? new Date(account.createdAt) : new Date(now.getFullYear(), now.getMonth(), 1);
  const cursor = new Date(createdAt.getFullYear(), createdAt.getMonth(), 1);
  let monthsOverdue = 0;
  while (cursor <= now) {
    const cycleDue = new Date(cursor.getFullYear(), cursor.getMonth(), billingDay, 12, 0, 0);
    if (now >= cycleDue && !paidMonths.has(monthKey(cursor))) monthsOverdue += 1;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const dueDate = paidThisMonth ? nextCycleDueDate : currentCycleDueDate;
  const days = daysUntil(dueDate);

  let paymentStatus = "upcoming";
  if (paidThisMonth) paymentStatus = "paid";
  else if (days < 0) paymentStatus = "overdue";
  else if (days <= 3) paymentStatus = "due_soon";

  return {
    nextDueDate: dueDate,
    daysUntilDue: days,
    paymentStatus,
    monthsPaid,
    monthsOverdue
  };
}
