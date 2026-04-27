import { useAuth } from "../context/AuthContext.jsx";
import { money } from "../utils/format.js";

export function useCurrency() {
  const { user, rates } = useAuth();
  const currency = user?.settings?.currency || "MYR";
  return {
    currency,
    rates: rates?.rates || null,
    rateMeta: rates,
    money: (value, source = "USD") => money(value, currency, rates?.rates, source)
  };
}
