import { motion } from "framer-motion";
import { LockKeyhole, Router, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, register, token } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
    } catch (err) {
      const validation = err.response?.data?.errors?.fieldErrors;
      setError(validation ? Object.values(validation).flat()[0] : err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-ink">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-4 md:px-8 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:py-8">
        <section className="flex min-h-[50vh] flex-col justify-between rounded-lg border border-[#e4ddd2] bg-[#fffaf1] p-5 md:p-8 lg:min-h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded bg-[#15110d] text-white"><Router size={22} /></div>
              <div>
                <p className="text-sm font-semibold leading-tight">Starlink Manager Pro</p>
                <p className="text-xs text-muted">Developed by Tao Mon Lae</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded border border-[#e4ddd2] bg-white/70 px-3 py-2 text-xs text-muted sm:flex">
              <ShieldCheck size={14} />
              Private workspace
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="my-10 max-w-2xl">
            <p className="mono-label">CALM ACCOUNT MANAGEMENT</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-normal md:text-6xl">A gentle place to manage every Starlink line.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted md:text-lg">Keep accounts, billing dates, payments, receipts and receivables organized in a private workspace that feels clear at the start of the day and calm at the end of it.</p>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-3">
            <ComfortNote icon={LockKeyhole} title="Private" text="Your records stay in your own workspace." />
            <ComfortNote icon={Sparkles} title="Branded" text="Use your app name and logo on PDFs." />
            <ComfortNote icon={ShieldCheck} title="Steady" text="Billing history stays easy to review." />
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-lg border border-[#e4ddd2] bg-[#fffaf1] p-4">
            <p className="text-sm leading-6 text-muted">Sign in or create a workspace without clutter. Once inside, the full dashboard handles accounts, payments, receivables and reports.</p>
          </div>

          <form onSubmit={submit} className="w-full rounded-lg border border-[#e4ddd2] bg-white p-5 shadow-[0_18px_60px_rgba(60,44,28,0.08)] md:p-6">
            <div className="mb-5 flex rounded border border-[#e4ddd2] bg-[#f7f4ee] p-1">
              <button type="button" className={`flex-1 rounded px-3 py-2 text-sm font-medium transition ${mode === "login" ? "bg-[#15110d] text-white" : "text-muted hover:text-ink"}`} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
              <button type="button" className={`flex-1 rounded px-3 py-2 text-sm font-medium transition ${mode === "register" ? "bg-[#15110d] text-white" : "text-muted hover:text-ink"}`} onClick={() => { setMode("register"); setError(""); setEmail(""); setPassword(""); }}>Create account</button>
            </div>
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">{mode === "register" ? "Create your workspace" : "Welcome back"}</h2>
              <p className="mt-1 text-sm text-muted">{mode === "register" ? "Use a strong password with uppercase, lowercase and a number." : "Sign in to continue managing your Starlink records."}</p>
            </div>
            {error && <div className="mb-4 rounded border border-rose/20 bg-rose/10 px-3 py-2 text-sm text-rose">{error}</div>}
            {mode === "register" && (
              <label className="grid gap-1 text-sm font-medium">Name<input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            )}
            <label className={`grid gap-1 text-sm font-medium ${mode === "register" ? "mt-4" : ""}`}>Email<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" /></label>
            <label className="mt-4 grid gap-1 text-sm font-medium">Password<input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>
            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-[#15110d] px-3 py-2 text-sm font-medium text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50" disabled={loading}>{loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}</button>
            <p className="mt-5 text-center text-xs text-muted">Source-available non-commercial software</p>
          </form>
        </section>
      </div>
    </main>
  );
}

function ComfortNote({ icon: Icon, title, text }) {
  return (
    <div className="rounded border border-[#e4ddd2] bg-white/70 p-3">
      <Icon size={17} className="text-brand" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}
