import { Download, Plus, Settings2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AccountForm from "../components/AccountForm.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";
import { downloadFromApi } from "../utils/download.js";
import { dateShort, paymentLabel, statusLabel } from "../utils/format.js";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [owners, setOwners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const { money } = useCurrency();
  const fileRef = useRef(null);

  const load = () => Promise.all([api.get("/accounts", { params: { q: debouncedQuery } }), api.get("/owners")]).then(([accountsRes, ownersRes]) => {
    setAccounts(accountsRes.data.accounts);
    setOwners(ownersRes.data.owners);
  });
  useEffect(() => { load(); }, [debouncedQuery]);

  async function save(form) {
    await api.post("/accounts", form);
    setShowForm(false);
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this account and its payment history?")) return;
    await api.delete(`/accounts/${id}`);
    load();
  }

  async function importFile(file) {
    const body = new FormData();
    body.append("file", file);
    await api.post("/import", body);
    load();
  }

  return (
    <>
      <PageHeader title="Accounts" subtitle="Manage your own Starlink accounts and accounts you operate for other people or teams." actions={<><button className="btn-ghost" onClick={() => fileRef.current.click()}><Upload size={16} />Import</button><button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Add account</button></>} />
      <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx" onChange={(e) => e.target.files[0] && importFile(e.target.files[0])} />
      <div className="mb-4 flex gap-2"><input className="input max-w-md" placeholder="Filter by name, Gmail, or location" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="btn-ghost" onClick={() => downloadFromApi("/reports/export.csv")}><Download size={16} />CSV</button></div>
      {showForm && <div className="mb-4"><AccountForm owners={owners} onSubmit={save} onCancel={() => setShowForm(false)} /></div>}
      {!accounts.length ? <EmptyState title="No accounts found" text="Add or import accounts to begin tracking renewals and payments." /> : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1024px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-white/5"><tr><th className="px-4 py-3">Account</th><th>Owner</th><th>Location</th><th>Cost</th><th>Billing</th><th>Months</th><th>Status</th><th>Payment</th><th></th></tr></thead>
              <tbody className="divide-y divide-line dark:divide-white/10">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3"><Link to={`/accounts/${account.id}`} className="text-left font-medium hover:underline">{account.accountName}</Link><p className="text-xs text-slate-500">{account.gmailEmail}</p></td>
                    <td>{account.owner?.name || "Me"}</td><td>{account.location}</td><td>{money(account.monthlyCost, account.currency)}</td><td>{dateShort(account.billing.nextDueDate)}</td>
                    <td><span className="rounded bg-mint/15 px-2 py-0.5 text-xs font-medium text-mint">Paid {account.billing.monthsPaid ?? 0}</span>{account.billing.monthsOverdue > 0 && <span className="ml-1 rounded bg-rose/15 px-2 py-0.5 text-xs font-medium text-rose">Overdue {account.billing.monthsOverdue}</span>}</td>
                    <td>{statusLabel(account.status)}</td><td>{paymentLabel(account.billing.paymentStatus)}</td>
                    <td className="pr-4 text-right"><Link to={`/accounts/${account.id}`} className="btn-ghost mr-1 px-2" title="Manage"><Settings2 size={16} /></Link><button className="btn-ghost px-2 text-rose" onClick={() => remove(account.id)}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
