import { Inbox } from "lucide-react";

export default function EmptyState({ title, text }) {
  return (
    <div className="panel grid place-items-center px-6 py-14 text-center">
      <Inbox className="text-slate-400" size={34} />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

