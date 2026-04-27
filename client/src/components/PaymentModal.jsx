import { X } from "lucide-react";
import { useState } from "react";

export default function PaymentModal({ accounts, initialAccountId, lockAccount = false, title = "Quick add payment", initial = null, onClose, onSave }) {
  const initialAccount = accounts.find((account) => account.id === initialAccountId) || accounts[0];
  const [form, setForm] = useState({
    id: initial?.id || null,
    accountId: initial?.accountId || initialAccount?.id || "",
    amount: initial?.amount ?? initialAccount?.monthlyCost ?? "",
    method: initial?.method || "CARD",
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    reference: initial?.reference || "",
    notes: initial?.notes || "",
    createReceivable: Boolean(initial?.receivable),
    debtorName: initial?.receivable?.debtorName || "",
    debtorContact: initial?.receivable?.debtorContact || "",
    amountReceived: initial?.receivable?.amountReceived ?? 0
  });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const receivableAmount = Number(form.amount || 0);
  const amountReceived = Math.max(Number(form.amountReceived || 0), 0);
  const outstanding = Math.max(receivableAmount - amountReceived, 0);
  const debtSettled = receivableAmount > 0 && outstanding === 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form className="panel w-full max-w-lg p-5" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button type="button" className="btn-ghost px-2" onClick={onClose}><X size={16} /></button></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium md:col-span-2">Account<select className="input" value={form.accountId} disabled={lockAccount} onChange={(e) => { const acc = accounts.find((a) => a.id === e.target.value); setForm((p) => ({ ...p, accountId: e.target.value, amount: acc?.monthlyCost || p.amount })); }}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.accountName}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-medium">Amount<input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} required /></label>
          <label className="grid gap-1 text-sm font-medium">Payment date<input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required /></label>
          <label className="grid gap-1 text-sm font-medium">Method<select className="input" value={form.method} onChange={(e) => set("method", e.target.value)}><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="PAYPAL">PayPal</option><option value="OTHER">Other</option></select></label>
          <label className="grid gap-1 text-sm font-medium">Reference<input className="input" value={form.reference} onChange={(e) => set("reference", e.target.value)} /></label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">Notes<textarea className="input min-h-20" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2"><input type="checkbox" checked={form.createReceivable} onChange={(e) => set("createReceivable", e.target.checked)} />Paid for someone else</label>
          {form.createReceivable && (
            <>
              <label className="grid gap-1 text-sm font-medium">Debtor<input className="input" value={form.debtorName} onChange={(e) => set("debtorName", e.target.value)} required={form.createReceivable} /></label>
              <label className="grid gap-1 text-sm font-medium">Contact<input className="input" value={form.debtorContact} onChange={(e) => set("debtorContact", e.target.value)} /></label>
              <label className="grid gap-1 text-sm font-medium">Received amount<input className="input" type="number" min="0" step="0.01" value={form.amountReceived} onChange={(e) => set("amountReceived", e.target.value)} /></label>
              <div className="rounded-xl bg-slate-100/80 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <p>Outstanding (auto): <strong>{outstanding.toFixed(2)}</strong></p>
                {debtSettled && <p className="mt-1 text-xs text-mint">Debt is fully paid. You can still edit the received amount here.</p>}
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary">{form.id ? "Update payment" : "Save payment"}</button></div>
      </form>
    </div>
  );
}
