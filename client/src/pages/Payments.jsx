import { FileText, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";
import { downloadFromApi } from "../utils/download.js";
import { dateShort } from "../utils/format.js";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const { money } = useCurrency();
  const load = () => Promise.all([api.get("/payments"), api.get("/accounts")]).then(([p, a]) => { setPayments(p.data.payments); setAccounts(a.data.accounts); });
  useEffect(() => { load(); }, []);

  async function savePayment(form) {
    const { id, createReceivable, debtorName, debtorContact, amountReceived, ...paymentForm } = form;
    const request = id ? api.put(`/payments/${id}`, paymentForm) : api.post("/payments", paymentForm);
    const { data } = await request;
    const paymentId = data.payment.id;
    const existingReceivable = id ? payments.find((item) => item.id === id)?.receivable : null;

    if (createReceivable) {
      const receivablePayload = {
        accountId: paymentForm.accountId,
        paymentId,
        debtorName,
        debtorContact,
        description: `Starlink payment paid on behalf of ${debtorName}`,
        amount: paymentForm.amount,
        amountReceived: Number(amountReceived || 0),
        dueDate: null,
        status: "OPEN",
        notes: paymentForm.notes || null
      };
      if (existingReceivable?.id) await api.put(`/receivables/${existingReceivable.id}`, receivablePayload);
      else await api.post("/receivables", receivablePayload);
    } else if (existingReceivable?.id) {
      await api.delete(`/receivables/${existingReceivable.id}`);
    }
    setEditingPayment(null);
    load();
    if (data?.payment?.id && confirm("Payment saved. Download the printable receipt now?")) {
      downloadReceipt(data.payment.id);
    }
  }

  function downloadReceipt(id) {
    return downloadFromApi(`/payments/${id}/receipt.pdf`, `starlink-receipt-${id.slice(-6).toUpperCase()}.pdf`);
  }

  return (
    <>
      <PageHeader title="Payment history" subtitle="A complete ledger of Starlink payments, methods, references and notes." actions={<button className="btn-primary" onClick={() => setEditingPayment({})}><Plus size={16} />Add payment</button>} />
      {editingPayment && <PaymentModal accounts={accounts} initial={editingPayment.id ? editingPayment : null} onClose={() => setEditingPayment(null)} onSave={savePayment} />}
      {!payments.length ? <EmptyState title="No payments yet" text="Record a payment manually or mark an account paid from Billing." /> : (
        <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[840px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-white/5"><tr><th className="px-4 py-3">Date</th><th>Account</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th><th></th></tr></thead>
          <tbody className="divide-y divide-line dark:divide-white/10">{payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">{dateShort(p.date)}</td>
              <td><p className="font-medium">{p.account.accountName}</p><p className="text-xs text-slate-500">{p.account.gmailEmail}</p></td>
              <td>{money(p.amount, p.currency || p.account?.currency || "MYR")}</td>
              <td>{p.method.replace("_", " ")}</td>
              <td>{p.reference || "-"}</td>
              <td>{p.notes || "-"}</td>
              <td className="pr-4 text-right">
                <button className="btn-ghost px-2" title="Edit payment" onClick={() => setEditingPayment(p)}><Pencil size={16} /></button>
                <button className="btn-ghost px-2" title="Download receipt" onClick={() => downloadReceipt(p.id)}><FileText size={16} /></button>
              </td>
            </tr>
          ))}</tbody>
        </table></div></div>
      )}
    </>
  );
}
