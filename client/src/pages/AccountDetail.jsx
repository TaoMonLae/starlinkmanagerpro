import { ArrowLeft, CheckCircle2, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AccountForm from "../components/AccountForm.jsx";
import PageHeader from "../components/PageHeader.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";
import { downloadFromApi } from "../utils/download.js";
import { dateShort, paymentLabel, statusLabel } from "../utils/format.js";

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [owners, setOwners] = useState([]);
  const [editing, setEditing] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const { money } = useCurrency();

  const load = () => Promise.all([api.get(`/accounts/${id}`), api.get("/owners")]).then(([a, o]) => {
    setAccount(a.data.account);
    setOwners(o.data.owners);
  });
  useEffect(() => { load(); }, [id]);

  async function save(form) {
    await api.put(`/accounts/${id}`, form);
    setEditing(false);
    load();
  }

  async function markPaid() {
    const { data } = await api.post(`/payments/mark-paid/${id}`);
    await load();
    if (data?.payment?.id && confirm("Payment recorded. Download the printable receipt now?")) {
      downloadReceipt(data.payment.id);
    }
  }

  async function savePayment(form) {
    const { createReceivable, debtorName, debtorContact, ...paymentForm } = form;
    const { data } = await api.post("/payments", paymentForm);
    if (createReceivable) {
      await api.post("/receivables", {
        accountId: paymentForm.accountId,
        paymentId: data.payment.id,
        debtorName,
        debtorContact,
        description: `Starlink payment paid on behalf of ${debtorName}`,
        amount: paymentForm.amount,
        amountReceived: 0,
        dueDate: null,
        status: "OPEN",
        notes: paymentForm.notes || null
      });
    }
    setPaymentModal(false);
    await load();
    if (data?.payment?.id && confirm("Payment saved. Download the printable receipt now?")) {
      downloadReceipt(data.payment.id);
    }
  }

  function downloadReceipt(paymentId) {
    return downloadFromApi(`/payments/${paymentId}/receipt.pdf`, `starlink-receipt-${paymentId.slice(-6).toUpperCase()}.pdf`);
  }

  async function remove() {
    if (!confirm("Delete this account and its payment history?")) return;
    await api.delete(`/accounts/${id}`);
    navigate("/accounts");
  }

  if (!account) return <Skeleton className="h-96" />;
  const billing = account.billing || {};
  const payments = [...(account.payments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <PageHeader
        title={account.accountName}
        subtitle={`${account.gmailEmail} · ${account.location}`}
        actions={
          <>
            <Link to="/accounts" className="btn-ghost"><ArrowLeft size={16} />Back</Link>
            <button className="btn-ghost" onClick={() => setEditing(true)}><Pencil size={16} />Edit</button>
            <button className="btn-ghost" onClick={() => setPaymentModal(true)}><Plus size={16} />Add payment</button>
            <button className="btn-primary" onClick={markPaid} disabled={billing.paymentStatus === "paid"}><CheckCircle2 size={16} />Mark paid</button>
            <button className="btn-ghost text-rose" onClick={remove}><Trash2 size={16} />Delete</button>
          </>
        }
      />

      {paymentModal && <PaymentModal accounts={[account]} initialAccountId={account.id} lockAccount title="Add payment history" onClose={() => setPaymentModal(false)} onSave={savePayment} />}
      {editing && <div className="mb-4"><AccountForm owners={owners} initial={account} onSubmit={save} onCancel={() => setEditing(false)} /></div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monthly cost" value={money(account.monthlyCost, account.currency)} />
        <Stat label="Currency" value={account.currency || "MYR"} />
        <Stat label="Billing date" value={dateShort(account.billingDate)} />
        <Stat label="Status" value={statusLabel(account.status)} />
        <Stat label="Months paid" value={billing.monthsPaid ?? 0} accent="mint" />
        <Stat label="Months overdue" value={billing.monthsOverdue ?? 0} accent={billing.monthsOverdue ? "rose" : "muted"} />
        <Stat label="Next due" value={dateShort(billing.nextDueDate)} />
        <Stat label="Payment status" value={paymentLabel(billing.paymentStatus)} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Owner</h2>
          <p className="mt-2 text-sm">{account.owner?.name || "Me (personal account)"}</p>
          {account.owner?.contact && <p className="mt-1 text-xs text-muted">{account.owner.contact}</p>}
          {account.owner?.email && <p className="text-xs text-muted">{account.owner.email}</p>}
          {account.owner?.phone && <p className="text-xs text-muted">{account.owner.phone}</p>}
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{account.notes || "No notes."}</p>
        </div>
      </div>

      <div className="mt-4 panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-oat px-4 py-3 dark:border-white/10">
          <h2 className="text-lg font-semibold">Payment history ({payments.length})</h2>
          <span className="text-xs text-muted dark:text-slate-400">Total recorded: {money(payments.reduce((s, p) => s + Number(p.amount || 0), 0), account.currency)}</span>
        </div>
        {payments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white text-xs uppercase text-muted dark:bg-white/5 dark:text-slate-400"><tr><th className="px-4 py-3">Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th><th></th></tr></thead>
              <tbody className="divide-y divide-oat dark:divide-white/10">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/70 dark:hover:bg-white/5">
                    <td className="px-4 py-3">{dateShort(p.date)}</td>
                    <td>{money(p.amount, account.currency)}</td>
                    <td>{p.method.replace("_", " ")}</td>
                    <td>{p.reference || "-"}</td>
                    <td>{p.notes || "-"}</td>
                    <td className="pr-4 text-right"><button className="btn-ghost px-2" title="Download receipt" onClick={() => downloadReceipt(p.id)}><FileText size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, accent = "ink" }) {
  const tone = {
    mint: "text-mint",
    rose: "text-rose",
    muted: "text-muted dark:text-slate-400",
    ink: "text-ink dark:text-white"
  }[accent] || "text-ink dark:text-white";
  return (
    <div className="panel p-4">
      <p className="mono-label">{label}</p>
      <p className={`mt-2 text-2xl font-normal leading-none ${tone}`}>{value}</p>
    </div>
  );
}
