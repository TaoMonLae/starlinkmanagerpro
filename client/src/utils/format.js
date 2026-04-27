export const supportedCurrencies = ["USD", "SGD", "MYR", "MMK"];

export const currencyMeta = {
  USD: { label: "USD", name: "US Dollar" },
  SGD: { label: "SGD", name: "Singapore Dollar" },
  MYR: { label: "MYR", name: "Malaysian Ringgit" },
  MMK: { label: "MMK", name: "Myanmar Kyat" }
};

export function convertMoney(value, currency = "USD", rates = null, source = "USD") {
  const amount = Number(value || 0);
  if (!rates || currency === source) return amount;
  if (!rates[currency] || !rates[source]) return amount;
  return (amount / Number(rates[source])) * Number(rates[currency]);
}

export const money = (value, currency = "USD", rates = null, source = "USD") => {
  const converted = convertMoney(value, currency, rates, source);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(converted);
};

export const dateShort = (value) =>
  value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "-";

export const statusLabel = (status) =>
  ({ ACTIVE: "Active", SUSPENDED: "Suspended", BACKUP: "Backup", CANCELLED: "Cancelled" })[status] || status;

export const paymentLabel = (status) =>
  ({ paid: "Paid", due_soon: "Due soon", overdue: "Overdue", upcoming: "Upcoming" })[status] || status;
