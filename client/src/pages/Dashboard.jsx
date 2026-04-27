import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock3, CreditCard, HandCoins, Router, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "../components/PageHeader.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useCurrency } from "../hooks/useCurrency.js";
import { api } from "../utils/api.js";
import { dateShort, paymentLabel } from "../utils/format.js";

const colors = ["#0bdf50", "#fe4c02", "#c41c1c", "#65b5ff"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { money } = useCurrency();
  useEffect(() => { api.get("/dashboard").then((res) => setData(res.data)); }, []);

  if (!data) return <DashboardSkeleton />;

  const cards = [
    ["Total Accounts", data.kpis.totalAccounts, Router],
    ["Monthly Total Cost", money(data.kpis.monthlyTotalCost), CreditCard],
    ["Paid Accounts", data.kpis.paidAccounts, CheckCircle2],
    ["Due Soon", data.kpis.dueSoon, Clock3],
    ["Overdue", data.kpis.overdue, AlertCircle],
    ["Average Monthly Cost", money(data.kpis.averageMonthlyCost), TrendingUp],
    ["Receivable Outstanding", money(data.kpis.receivableOutstanding), HandCoins],
    ["Open Receivables", data.kpis.openReceivables, HandCoins],
    ["Managed For Others", data.kpis.managedForOthers, Router]
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A clean operating view for all Starlink accounts, renewals, costs and activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon], index) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} key={label} className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="mono-label">{label}</p>
              <Icon size={18} className="text-slate-400" />
            </div>
            <p className="mt-4 text-3xl font-normal leading-none">{value}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="panel p-5">
          <h2 className="text-2xl font-normal leading-none">Monthly spending</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer><LineChart data={data.monthlySpending}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Line type="monotone" dataKey="amount" stroke="#ff5600" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-2xl font-normal leading-none">Payment status</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer><PieChart><Pie data={data.paymentStatus} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92}>{data.paymentStatus.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-2xl font-normal leading-none">Upcoming renewals</h2>
          <div className="mt-4 divide-y divide-oat dark:divide-white/10">
            {data.upcomingRenewals.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-3">
                <div><p className="font-medium">{account.accountName}</p><p className="text-sm text-slate-500">{account.gmailEmail}</p></div>
                <div className="text-right"><p className="text-sm font-medium">{dateShort(account.billing.nextDueDate)}</p><p className="text-xs text-slate-500">{paymentLabel(account.billing.paymentStatus)}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-2xl font-normal leading-none">Receivables</h2>
          <div className="mt-4 divide-y divide-oat dark:divide-white/10">
            {data.receivables.map((item) => <div key={item.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-medium">{item.debtorName}</p><p className="text-xs text-muted">{item.account?.accountName || item.description}</p></div><p className="font-medium">{money(item.outstanding, item.currency || item.account?.currency || "MYR")}</p></div>)}
          </div>
        </div>
        <div className="panel p-5 xl:col-span-2">
          <h2 className="text-2xl font-normal leading-none">Recent activity</h2>
          <div className="mt-4 divide-y divide-oat dark:divide-white/10">
            {data.recentActivity.map((item) => <div key={item.id} className="py-3"><p className="text-sm font-medium">{item.message}</p><p className="text-xs text-slate-500">{dateShort(item.createdAt)}</p></div>)}
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return <div className="grid gap-4"><Skeleton className="h-12 w-72" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div><Skeleton className="h-80" /></div>;
}
