import { useEffect, useState } from "react";

const empty = { accountId: "", debtorName: "", debtorContact: "", description: "", amount: "", amountReceived: 0, dueDate: "", status: "OPEN", notes: "" };

export default function ReceivableForm({ accounts, initial, onCancel, onSubmit }) {
  const [form, setForm] = useState(empty);
  useEffect(() => setForm(initial ? { ...initial, dueDate: initial.dueDate?.slice(0, 10) || "" } : empty), [initial]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form className="panel p-5" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, accountId: form.accountId || null, dueDate: form.dueDate || null }); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Debtor<input className="input" value={form.debtorName} onChange={(e) => set("debtorName", e.target.value)} required /></label>
        <label className="grid gap-1 text-sm font-medium">Contact<input className="input" value={form.debtorContact || ""} onChange={(e) => set("debtorContact", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Account<select className="input" value={form.accountId || ""} onChange={(e) => set("accountId", e.target.value)}><option value="">No linked account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Description<input className="input" value={form.description} onChange={(e) => set("description", e.target.value)} required /></label>
        <label className="grid gap-1 text-sm font-medium">Amount owed<input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} required /></label>
        <label className="grid gap-1 text-sm font-medium">Received<input className="input" type="number" step="0.01" value={form.amountReceived} onChange={(e) => set("amountReceived", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Due date<input className="input" type="date" value={form.dueDate || ""} onChange={(e) => set("dueDate", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Status<select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}><option value="OPEN">Open</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="WAIVED">Waived</option></select></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Notes<textarea className="input min-h-20" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" type="button" onClick={onCancel}>Cancel</button><button className="btn-primary">Save receivable</button></div>
    </form>
  );
}

