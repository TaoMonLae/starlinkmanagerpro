import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";
import { dateShort, paymentLabel } from "../utils/format.js";

export default function Billing() {
  const [accounts, setAccounts] = useState([]);
  const { money } = useCurrency();
  const load = () => api.get("/accounts").then((res) => setAccounts(res.data.accounts));
  useEffect(() => { load(); }, []);
  async function markPaid(id) { await api.post(`/payments/mark-paid/${id}`); load(); }
  const sorted = [...accounts].sort((a, b) => new Date(a.billing.nextDueDate) - new Date(b.billing.nextDueDate));

  return (
    <>
      <PageHeader title="Billing" subtitle="Review next due dates, overdue items, due-soon accounts and one-click paid status." />
      {!sorted.length ? <EmptyState title="No billing data" text="Accounts will appear here as soon as they are created." /> : <div className="grid gap-3">
        {sorted.map((account) => (
          <div key={account.id} className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div><p className="font-semibold">{account.accountName}</p><p className="text-sm text-slate-500">{account.gmailEmail} · {account.location}</p></div>
            <div className="grid grid-cols-3 gap-4 text-sm md:min-w-[420px]"><span>{money(account.monthlyCost, account.currency)}</span><span>{dateShort(account.billing.nextDueDate)}</span><span>{paymentLabel(account.billing.paymentStatus)}</span></div>
            <button className="btn-primary" onClick={() => markPaid(account.id)} disabled={account.billing.paymentStatus === "paid"}><CheckCircle2 size={16} />Mark paid</button>
          </div>
        ))}
      </div>}
    </>
  );
}
