import { Bell, ContactRound, CreditCard, HandCoins, LayoutDashboard, LineChart, LogOut, Menu, Moon, Router, Search, Settings, Sun, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/owners", label: "Owners", icon: ContactRound },
  { to: "/billing", label: "Billing", icon: Router },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/receivables", label: "Receivables", icon: HandCoins },
  { to: "/reports", label: "Reports", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("smp_theme") === "dark");
  const appName = user?.settings?.appName || "Starlink Manager Pro";
  const logoDataUrl = user?.settings?.logoDataUrl;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("smp_theme", dark ? "dark" : "light");
  }, [dark]);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-oat bg-cream p-4 backdrop-blur dark:border-white/10 dark:bg-[#0d1117]/95">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="grid h-10 w-10 place-items-center rounded bg-brand text-white">
          {logoDataUrl ? <img src={logoDataUrl} alt="" className="h-8 w-8 object-contain" /> : <Router size={20} />}
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-ink dark:text-white">{appName}</p>
          <p className="text-xs text-muted">Operations console</p>
        </div>
      </div>
      <nav className="mt-6 grid gap-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-ink text-white dark:bg-white dark:text-ink" : "text-muted hover:bg-white dark:text-slate-300 dark:hover:bg-white/10"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg border border-oat bg-white p-3 text-xs text-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        <p className="font-medium text-ink dark:text-white">{user?.name}</p>
        <p className="truncate">{user?.email}</p>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted dark:text-slate-500">Developed by Tao Mon Lae@2026</p>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-ink dark:bg-[#090b10] dark:text-slate-100">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="relative h-full">{sidebar}</div>
        </div>
      )}
      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-oat bg-[#f4f1ea]/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#090b10]/85">
          <div className="flex items-center gap-3">
            <button className="btn-ghost px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
              <input className="input pl-10" placeholder="Search accounts, payments, locations..." />
            </div>
            <button className="btn-ghost px-2" aria-label="Notifications"><Bell size={18} /></button>
            <button className="btn-ghost px-2" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="btn-ghost px-2" onClick={logout} aria-label="Logout"><LogOut size={18} /></button>
          </div>
        </header>
        <div className="p-4 md:p-6 xl:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
