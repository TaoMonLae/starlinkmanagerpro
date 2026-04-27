import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "../components/PageHeader.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";
import { downloadFromApi } from "../utils/download.js";

export default function Reports() {
  const [data, setData] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const { money } = useCurrency();
  useEffect(() => {
    api.get("/reports").then((res) => setData(res.data));
    api.get("/reports/monthly", { params: { months: 12 } }).then((res) => setMonthly(res.data.months));
  }, []);
  if (!data) return <Skeleton className="h-96" />;
  return (
    <>
      <PageHeader title="Reports" subtitle="Spend trends, yearly totals, expensive accounts and paid versus unpaid rollups." actions={<button className="btn-primary" onClick={() => downloadFromApi("/reports/export.csv")}><Download size={16} />Export CSV</button>} />
      <div className="mb-4 flex justify-end">
        <button className="btn-ghost" onClick={() => downloadFromApi("/reports/receivables.pdf")}><Download size={16} />Receivables PDF</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Monthly spend trend"><ResponsiveContainer><BarChart data={data.monthlySpendTrend}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="amount" fill="#ff5600" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartPanel>
        <ChartPanel title="Yearly total"><ResponsiveContainer><BarChart data={data.yearlyTotal}><XAxis dataKey="year" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="amount" fill="#0bdf50" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartPanel>
        <div className="panel p-5"><h2 className="font-semibold">Top expensive accounts</h2><div className="mt-4 divide-y divide-line dark:divide-white/10">{data.topExpensiveAccounts.map((a) => <div key={a.id} className="flex justify-between py-3"><span>{a.accountName}</span><strong>{money(a.monthlyCost, a.currency)}</strong></div>)}</div></div>
        <ChartPanel title="Paid vs unpaid"><ResponsiveContainer><PieChart><Pie data={data.paidVsUnpaid} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96}>{data.paidVsUnpaid.map((_, i) => <Cell key={i} fill={i ? "#F43F5E" : "#10B981"} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartPanel>
        <div className="panel p-5 xl:col-span-2">
          <h2 className="text-2xl font-normal leading-none">Receivable ledger</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Summary label="Total" value={money(data.receivableSummary.total)} />
            <Summary label="Received" value={money(data.receivableSummary.received)} />
            <Summary label="Outstanding" value={money(data.receivableSummary.outstanding)} />
          </div>
        </div>
        <div className="panel overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-oat px-5 py-4">
            <h2 className="text-2xl font-normal leading-none">Monthly report</h2>
            <span className="text-xs text-muted">Rolling 12 months</span>
          </div>
          {!monthly ? <Skeleton className="m-5 h-48" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-white text-xs uppercase text-muted dark:bg-white/5 dark:text-slate-400"><tr><th className="px-4 py-3">Month</th><th>Total spend</th><th>Payments</th><th>Accounts paid</th><th>Accounts overdue</th></tr></thead>
                <tbody className="divide-y divide-oat dark:divide-white/10">
                  {monthly.map((row) => (
                    <tr key={row.month} className="hover:bg-white/70">
                      <td className="px-4 py-3 font-medium">{row.label}</td>
                      <td>{money(row.totalUsd)}</td>
                      <td>{row.paymentCount}</td>
                      <td><span className="rounded bg-mint/15 px-2 py-0.5 text-xs font-medium text-mint">{row.paidAccounts}</span></td>
                      <td>{row.overdueAccounts > 0 ? <span className="rounded bg-rose/15 px-2 py-0.5 text-xs font-medium text-rose">{row.overdueAccounts}</span> : <span className="text-muted">0</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ChartPanel({ title, children }) {
  return <div className="panel p-5"><h2 className="text-2xl font-normal leading-none">{title}</h2><div className="mt-4 h-72">{children}</div></div>;
}

function Summary({ label, value }) {
  return <div className="rounded border border-oat bg-white p-4 dark:border-white/10 dark:bg-white/5"><p className="mono-label">{label}</p><p className="mt-2 text-2xl text-ink dark:text-white">{value}</p></div>;
}
