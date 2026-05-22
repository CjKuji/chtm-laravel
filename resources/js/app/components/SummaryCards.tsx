import { AuditSummary } from '../services/auditService';

interface Props {
  summary: AuditSummary | null;
  loading: boolean;
}

const peso = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

function Card({
  icon, label, value, sub, color,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 ${color}`}>
      <div className="text-3xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-20" />
    </div>
  );
}

export default function SummaryCards({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card
        icon="💰"
        label="Total Revenue"
        value={peso(summary.total_revenue)}
        sub={`Cash: ${peso(summary.cash_revenue)} · GCash: ${peso(summary.gcash_revenue)}`}
        color="border-l-4 border-l-emerald-500"
      />
      <Card
        icon="📋"
        label="Total Bookings"
        value={String(summary.total_bookings)}
        sub={`${summary.approved} approved · ${summary.pending} pending`}
        color="border-l-4 border-l-blue-500"
      />
      <Card
        icon="✅"
        label="Checked Out"
        value={String(summary.checked_out)}
        sub="Completed stays"
        color="border-l-4 border-l-teal-500"
      />
      <Card
        icon="❌"
        label="Cancelled / Rejected"
        value={String(summary.cancelled)}
        sub="Lost bookings"
        color="border-l-4 border-l-red-400"
      />
      <Card
        icon="🏠"
        label="Occupancy Rate"
        value={`${summary.occupancy_rate.toFixed(1)}%`}
        sub="Based on checked-out / total rooms"
        color="border-l-4 border-l-purple-500"
      />
      <Card
        icon="🌙"
        label="Avg Stay"
        value={`${summary.avg_stay_nights} nights`}
        sub="Per completed booking"
        color="border-l-4 border-l-indigo-400"
      />
      <Card
        icon="💳"
        label="Cash Revenue"
        value={peso(summary.cash_revenue)}
        sub="Walk-in payments"
        color="border-l-4 border-l-amber-500"
      />
      <Card
        icon="📱"
        label="GCash Revenue"
        value={peso(summary.gcash_revenue)}
        sub="Digital payments"
        color="border-l-4 border-l-pink-500"
      />
    </div>
  );
}
