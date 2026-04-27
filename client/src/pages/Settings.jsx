import { ArrowRightLeft, KeyRound, RefreshCw, Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../utils/api.js";
import { convertMoney, currencyMeta, money, supportedCurrencies } from "../utils/format.js";

export default function Settings() {
  const { user, setUser, rates, setRates } = useAuth();
  const [profile, setProfile] = useState({ name: "", theme: "system", currency: "MYR", inactivityMs: 1800000, appName: "Starlink Manager Pro", logoDataUrl: null });
  const [logoFile, setLogoFile] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [converter, setConverter] = useState({ amount: 100, from: "MYR", to: "USD" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/settings").then(({ data }) => setProfile({ name: data.user.name, ...(data.user.settings || {}) }));
  }, []);

  async function saveSettings(e) {
    e.preventDefault();
    const { logoDataUrl, ...settingsPayload } = profile;
    const { data } = await api.put("/settings", settingsPayload);
    setUser(data.user);
    localStorage.setItem("smp_user", JSON.stringify(data.user));
    setMessage("Settings saved");
  }

  async function uploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    const body = new FormData();
    body.append("logo", logoFile);
    const { data } = await api.post("/settings/logo", body, { headers: { "Content-Type": "multipart/form-data" } });
    const nextUser = { ...user, settings: { ...(user?.settings || {}), ...data.settings } };
    setProfile((prev) => ({ ...prev, ...data.settings }));
    setUser(nextUser);
    localStorage.setItem("smp_user", JSON.stringify(nextUser));
    setLogoFile(null);
    setMessage("Logo uploaded");
  }

  async function refreshRates() {
    const { data } = await api.get("/settings/rates", { params: { base: "USD" } });
    setRates(data);
    setMessage("Exchange rates refreshed");
  }

  async function changePassword(e) {
    e.preventDefault();
    await api.post("/auth/change-password", passwords);
    setPasswords({ currentPassword: "", newPassword: "" });
    setMessage("Password changed");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Profile preferences, password rotation, currency conversion and theme mode." />
      {message && <div className="mb-4 rounded-lg border border-mint/20 bg-mint/10 px-3 py-2 text-sm text-mint">{message}</div>}
      <div className="grid gap-4 xl:grid-cols-2">
        <form className="panel p-5" onSubmit={saveSettings}>
          <h2 className="mb-4 font-semibold">Profile</h2>
          <label className="grid gap-1 text-sm font-medium">Name<input className="input" value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
          <label className="mt-4 grid gap-1 text-sm font-medium">App name<input className="input" value={profile.appName || ""} onChange={(e) => setProfile({ ...profile, appName: e.target.value })} /></label>
          <label className="mt-4 grid gap-1 text-sm font-medium">Theme<select className="input" value={profile.theme || "system"} onChange={(e) => setProfile({ ...profile, theme: e.target.value })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <label className="mt-4 grid gap-1 text-sm font-medium">Currency<select className="input" value={profile.currency || "MYR"} onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>{supportedCurrencies.map((code) => <option key={code} value={code}>{code} - {currencyMeta[code].name}</option>)}</select></label>
          <button className="btn-primary mt-5"><Save size={16} />Save settings</button>
        </form>
        <form className="panel p-5" onSubmit={uploadLogo}>
          <h2 className="mb-4 font-semibold">Logo</h2>
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded border border-oat bg-white dark:border-white/10 dark:bg-white/5">
              {profile.logoDataUrl ? <img src={profile.logoDataUrl} alt="" className="h-12 w-12 object-contain" /> : <Upload size={22} />}
            </div>
            <label className="grid flex-1 gap-1 text-sm font-medium">Upload logo<input className="input" type="file" accept="image/png,image/jpeg" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} /></label>
          </div>
          <button className="btn-primary mt-5" disabled={!logoFile}><Upload size={16} />Upload logo</button>
        </form>
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Currency converter</h2>
              <p className="mt-1 text-sm text-muted">{rates?.provider || "Live rates"} · {rates?.updatedAt || "Waiting for rates"}</p>
            </div>
            <button className="btn-ghost px-2" onClick={refreshRates} aria-label="Refresh rates"><RefreshCw size={16} /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <label className="grid gap-1 text-sm font-medium">From<input className="input" type="number" step="0.01" value={converter.amount} onChange={(e) => setConverter({ ...converter, amount: e.target.value })} /><select className="input" value={converter.from} onChange={(e) => setConverter({ ...converter, from: e.target.value })}>{supportedCurrencies.map((code) => <option key={code}>{code}</option>)}</select></label>
            <div className="hidden pb-2 md:block"><ArrowRightLeft size={20} /></div>
            <label className="grid gap-1 text-sm font-medium">To<div className="rounded border border-oat bg-white px-3 py-2 text-lg dark:border-white/10 dark:bg-white/5 dark:text-white">{money(convertMoney(converter.amount, converter.to, rates?.rates, converter.from), converter.to)}</div><select className="input" value={converter.to} onChange={(e) => setConverter({ ...converter, to: e.target.value })}>{supportedCurrencies.map((code) => <option key={code}>{code}</option>)}</select></label>
          </div>
          {rates?.fallback && <p className="mt-3 text-xs text-amber">Using fallback rates because the live provider is unavailable.</p>}
          {!rates?.fallback && <p className="mt-3 text-xs text-muted">Rates by <a className="underline" href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Exchange Rate API</a>.</p>}
        </div>
        <form className="panel p-5" onSubmit={changePassword}>
          <h2 className="mb-4 font-semibold">Change password</h2>
          <label className="grid gap-1 text-sm font-medium">Current password<input className="input" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
          <label className="mt-4 grid gap-1 text-sm font-medium">New password<input className="input" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></label>
          <button className="btn-primary mt-5"><KeyRound size={16} />Update password</button>
        </form>
      </div>
    </>
  );
}
