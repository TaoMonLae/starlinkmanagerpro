import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";

const empty = { name: "", contact: "", email: "", phone: "", notes: "" };

export default function Owners() {
  const [owners, setOwners] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { money } = useCurrency();

  const load = () => api.get("/owners").then((res) => setOwners(res.data.owners));
  useEffect(() => { load(); }, []);

  async function save(form) {
    if (editing) await api.put(`/owners/${editing.id}`, form);
    else await api.post("/owners", form);
    setEditing(null);
    setShowForm(false);
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this owner? Linked accounts will become your own accounts.")) return;
    await api.delete(`/owners/${id}`);
    load();
  }

  return (
    <>
      <PageHeader
        title="Owners"
        subtitle="Create people or teams whose Starlink accounts you manage, then assign accounts to them."
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} />Add owner</button>}
      />
      {(showForm || editing) && <OwnerForm initial={editing} onCancel={() => { setEditing(null); setShowForm(false); }} onSubmit={save} />}
      {!owners.length ? <EmptyState title="No managed owners yet" text="Add someone you pay for or manage, then assign Starlink accounts to them." /> : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {owners.map((owner) => (
            <div key={owner.id} className="panel p-5">
              <div className="flex items-start justify-between gap-4">
                <button className="text-left" onClick={() => setEditing(owner)}>
                  <p className="text-2xl font-normal leading-none">{owner.name}</p>
                  <p className="mt-2 text-sm text-muted">{owner.contact || owner.email || owner.phone || "No contact added"}</p>
                </button>
                <button className="btn-ghost px-2 text-rose" onClick={() => remove(owner.id)}><Trash2 size={16} /></button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Accounts" value={owner.accountCount} />
                <Metric label="Monthly Cost" value={money(owner.monthlyTotal)} />
              </div>
              {owner.notes && <p className="mt-4 text-sm text-muted">{owner.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function OwnerForm({ initial, onCancel, onSubmit }) {
  const [form, setForm] = useState(empty);
  useEffect(() => setForm(initial || empty), [initial]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <form className="panel mb-4 p-5" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Name<input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></label>
        <label className="grid gap-1 text-sm font-medium">Primary contact<input className="input" value={form.contact || ""} onChange={(e) => set("contact", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Email<input className="input" type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Phone<input className="input" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Notes<textarea className="input min-h-20" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button><button className="btn-primary">Save owner</button></div>
    </form>
  );
}

function Metric({ label, value }) {
  return <div className="rounded border border-oat bg-white p-3 dark:border-white/10 dark:bg-white/5"><p className="mono-label">{label}</p><p className="mt-2 text-xl text-ink dark:text-white">{value}</p></div>;
}

