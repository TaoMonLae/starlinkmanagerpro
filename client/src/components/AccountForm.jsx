import { useEffect, useState } from "react";
import { currencyMeta, supportedCurrencies } from "../utils/format.js";

const todayInput = () => new Date().toISOString().slice(0, 10);
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const billingDateInput = (account) => {
  if (account?.billingDate) return dateInput(account.billingDate);
  if (account?.billingDay) {
    const today = new Date();
    return dateInput(new Date(today.getFullYear(), today.getMonth(), Number(account.billingDay), 12, 0, 0));
  }
  return todayInput();
};

const empty = { ownerId: "", accountName: "", gmailEmail: "", location: "", monthlyCost: "", currency: "MYR", billingDate: todayInput(), billingDay: 1, status: "ACTIVE", notes: "" };

export default function AccountForm({ owners = [], initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(empty);
  useEffect(() => { setForm(initial ? { ...initial, ownerId: initial.ownerId || "", currency: initial.currency || "MYR", monthlyCost: Number(initial.monthlyCost), billingDate: billingDateInput(initial) } : empty); }, [initial]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = () => {
    const billingDay = form.billingDate ? new Date(form.billingDate).getUTCDate() : form.billingDay;
    onSubmit({ ...form, billingDay, ownerId: form.ownerId || null });
  };

  return (
    <form className="panel p-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Field label="Managed owner"><select className="input" value={form.ownerId || ""} onChange={(e) => set("ownerId", e.target.value)}><option value="">My own account</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></Field></div>
        <Field label="Account name"><input className="input" value={form.accountName} onChange={(e) => set("accountName", e.target.value)} required /></Field>
        <Field label="Gmail"><input className="input" type="email" value={form.gmailEmail} onChange={(e) => set("gmailEmail", e.target.value)} required /></Field>
        <Field label="Location"><input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} required /></Field>
        <Field label="Monthly cost"><input className="input" type="number" step="0.01" value={form.monthlyCost} onChange={(e) => set("monthlyCost", e.target.value)} required /></Field>
        <Field label="Currency"><select className="input" value={form.currency || "MYR"} onChange={(e) => set("currency", e.target.value)}>{supportedCurrencies.map((code) => <option key={code} value={code}>{code} - {currencyMeta[code].name}</option>)}</select></Field>
        <Field label="Billing date"><input className="input" type="date" value={form.billingDate || ""} onChange={(e) => set("billingDate", e.target.value)} required /></Field>
        <Field label="Status"><select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="BACKUP">Backup</option><option value="CANCELLED">Cancelled</option></select></Field>
        <div className="md:col-span-2"><Field label="Notes"><textarea className="input min-h-24" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field></div>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button><button className="btn-primary">Save account</button></div>
    </form>
  );
}

function Field({ label, children }) {
  return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>;
}
