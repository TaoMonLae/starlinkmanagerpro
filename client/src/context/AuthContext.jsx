import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";

const AuthContext = createContext(null);
const INACTIVITY_MS = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("smp_token"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("smp_user") || "null"));
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return setLoading(false);
    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("smp_user", JSON.stringify(data.user));
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.get("/settings/rates", { params: { base: "USD" } }).then(({ data }) => setRates(data)).catch(() => setRates(null));
  }, [token, user?.settings?.currency]);

  useEffect(() => {
    if (!token) return undefined;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => logout(), user?.settings?.inactivityMs || INACTIVITY_MS);
    };
    ["mousemove", "keydown", "click", "touchstart"].forEach((event) => window.addEventListener(event, reset));
    reset();
    return () => {
      clearTimeout(timer);
      ["mousemove", "keydown", "click", "touchstart"].forEach((event) => window.removeEventListener(event, reset));
    };
  }, [token, user?.settings?.inactivityMs]);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("smp_token", data.token);
    localStorage.setItem("smp_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("smp_token", data.token);
    localStorage.setItem("smp_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("smp_token");
    localStorage.removeItem("smp_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, loading, login, register, logout, setUser, rates, setRates }), [token, user, loading, rates]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
