export function nextDueDate(billingDay, fromDate = new Date()) {
  const day = Math.min(Math.max(Number(billingDay), 1), 28);
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const candidate = new Date(year, month, day, 12, 0, 0);
  if (candidate < startOfDay(fromDate)) {
    return new Date(year, month + 1, day, 12, 0, 0);
  }
  return candidate;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntil(date, fromDate = new Date()) {
  const diff = startOfDay(date).getTime() - startOfDay(fromDate).getTime();
  return Math.ceil(diff / 86400000);
}

export function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
}

export function monthKey(date) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(date));
}

