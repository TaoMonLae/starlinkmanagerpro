const SUPPORTED_CURRENCIES = ["USD", "SGD", "MYR", "MMK"];
const FALLBACK_RATES = { USD: 1, SGD: 1.276625, MYR: 3.964545, MMK: 2104.883627 };
const CACHE_MS = 15 * 60 * 1000;

let cache = null;

export async function getExchangeRates(base = "USD") {
  const normalizedBase = SUPPORTED_CURRENCIES.includes(base) ? base : "USD";
  const now = Date.now();
  if (cache?.base === normalizedBase && now - cache.fetchedAt < CACHE_MS) return cache.data;

  const apiBase = process.env.EXCHANGE_RATE_API_URL || "https://open.er-api.com/v6/latest";
  try {
    const response = await fetch(`${apiBase}/${normalizedBase}`);
    if (!response.ok) throw new Error(`Rate API failed: ${response.status}`);
    const json = await response.json();
    if (json.result !== "success") throw new Error("Rate API returned an unsuccessful result");
    const rates = SUPPORTED_CURRENCIES.reduce((acc, code) => {
      acc[code] = Number(json.rates?.[code]);
      return acc;
    }, {});
    if (Object.values(rates).some((value) => !Number.isFinite(value))) throw new Error("Rate API missing a required currency");
    const data = {
      base: normalizedBase,
      rates,
      provider: "ExchangeRate-API Open Access",
      updatedAt: json.time_last_update_utc || new Date().toUTCString(),
      cached: false
    };
    cache = { base: normalizedBase, fetchedAt: now, data };
    return data;
  } catch {
    const usdToBase = FALLBACK_RATES[normalizedBase] || 1;
    const rates = SUPPORTED_CURRENCIES.reduce((acc, code) => {
      acc[code] = FALLBACK_RATES[code] / usdToBase;
      return acc;
    }, {});
    return {
      base: normalizedBase,
      rates,
      provider: "Fallback static rates",
      updatedAt: new Date().toUTCString(),
      cached: false,
      fallback: true
    };
  }
}

