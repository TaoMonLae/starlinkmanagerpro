import { FileText, HandCoins, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ReceivableForm from "../components/ReceivableForm.jsx";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";
import { downloadFromApi } from "../utils/download.js";
import { dateShort } from "../utils/format.js";

export default function Receivables() {
  const [receivables, setReceivables] = useState([]);
  const [summary, setSummary] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { money } = useCurrency();

  const load = () => Promise.all([api.get("/receivables"), api.get("/accounts")]).then(([r, a]) => {
    setReceivables(r.data.receivables);
    setSummary(r.data.summary);
    setAccounts(a.data.accounts);
  });
  useEffect(() => { load(); }, []);

  async function save(form) {
    if (editing) await api.put(`/receivables/${editing.id}`, form);
    else await api.post("/receivables", form);
    setEditing(null); setShowForm(false); load();
  }

  async function receive(item) {
    const amount = prompt(`Amount received from ${item.debtorName}`, item.outstanding);
    if (!amount) return;
    await api.post(`/receivables/${item.id}/receive`, { amount });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this receivable?")) return;
    await api.delete(`/receivables/${id}`);
    load();
  }

  return (
    <>
      <PageHeader
        title="Receivables"
        subtitle="Track money owed back to you when you pay Starlink costs on behalf of other people or teams."
        actions={<><button className="btn-ghost" onClick={() => downloadFromApi("/reports/receivables.pdf")}><FileText size={16} />PDF</button><button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} />Add receivable</button></>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Summary label="Outstanding" value={money(summary.outstanding)} />
        <Summary label="Received" value={money(summary.received)} />
        <Summary label="Open Items" value={(summary.open || 0) + (summary.partial || 0)} />
      </div>
      {(showForm || editing) && <div className="mb-4"><ReceivableForm accounts={accounts} initial={editing} onCancel={() => { setEditing(null); setShowForm(false); }} onSubmit={save} /></div>}
      {!receivables.length ? <EmptyState title="No receivables yet" text="Add a receivable when you pay for someone else's Starlink bill." /> : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white text-xs uppercase text-muted dark:bg-white/5 dark:text-slate-400"><tr><th className="px-4 py-3">Debtor</th><th>Account</th><th>Amount</th><th>Received</th><th>Outstanding</th><th>Due</th><th>Status</th><th></th></tr></thead>
              <tbody className="divide-y divide-oat dark:divide-white/10">
                {receivables.map((item) => {
                  const source = item.currency || item.account?.currency || "MYR";
                  return (
                  <tr key={item.id} className="hover:bg-white/70">
                    <td className="px-4 py-3"><button className="text-left font-medium" onClick={() => setEditing(item)}>{item.debtorName}</button><p className="text-xs text-muted">{item.description}</p></td>
                    <td>{item.account?.accountName || "-"}</td>
                    <td>{money(item.amount, source)}</td>
                    <td>{money(item.amountReceived, source)}</td>
                    <td className="font-semibold">{money(item.outstanding, source)}</td>
                    <td>{dateShort(item.dueDate)}</td>
                    <td>{item.status}</td>
                    <td className="pr-4 text-right"><button className="btn-ghost mr-2 px-2" onClick={() => receive(item)}><HandCoins size={16} /></button><button className="btn-ghost px-2 text-rose" onClick={() => remove(item.id)}><Trash2 size={16} /></button></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Summary({ label, value }) {
  return <div className="panel p-4"><p className="mono-label">{label}</p><p className="mt-3 text-3xl font-normal leading-none">{value}</p></div>;
}
