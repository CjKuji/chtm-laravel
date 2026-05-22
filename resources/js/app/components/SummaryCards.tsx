import {
  IconCash,
  IconClipboardList,
  IconCircleCheck,
  IconCircleX,
  IconHome,
  IconMoon,
  IconWallet,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { AuditSummary } from '@/app/services/audit.service';

interface Props {
  summary: AuditSummary | null;
  loading: boolean;
}

const peso = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

type CardProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
  iconBg: string;
  iconColor: string;
};

function Card({ icon: Icon, label, value, sub, accentColor, iconBg, iconColor }: CardProps) {
  return (
    <div
      className={`
        group relative bg-white rounded-xl border border-gray-100
        border-l-[3px] ${accentColor}
        shadow-[0_1px_4px_rgba(0,0,0,0.05)]
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]
        hover:-translate-y-0.5
        transition-all duration-200 ease-out
        p-4 flex items-start gap-3
      `}
    >
      <div
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
          ${iconBg} transition-transform duration-200 group-hover:scale-105
        `}
      >
        <Icon size={17} className={iconColor} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none mb-1.5">
          {label}
        </p>
        <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-gray-400 mt-1 leading-snug truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 border-l-[3px] border-l-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-gray-100 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-28" />
          <div className="h-2 bg-gray-100 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  const cards: CardProps[] = [
    {
      icon: IconCash,
      label: 'Total Revenue',
      value: peso(summary.total_revenue),
      sub: `Cash ${peso(summary.cash_revenue)} · GCash ${peso(summary.gcash_revenue)}`,
      accentColor: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
    {
      icon: IconClipboardList,
      label: 'Total Bookings',
      value: summary.total_bookings.toLocaleString(),
      sub: `${summary.approved} approved · ${summary.pending} pending`,
      accentColor: 'border-l-blue-500',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-700',
    },
    {
      icon: IconCircleCheck,
      label: 'Checked Out',
      value: summary.checked_out.toLocaleString(),
      sub: 'Completed stays',
      accentColor: 'border-l-teal-500',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-700',
    },
    {
      icon: IconCircleX,
      label: 'Cancelled / Rejected',
      value: summary.cancelled.toLocaleString(),
      sub: 'Lost bookings',
      accentColor: 'border-l-rose-400',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      icon: IconHome,
      label: 'Occupancy Rate',
      value: `${summary.occupancy_rate.toFixed(1)}%`,
      sub: 'Checked-out ÷ total rooms',
      accentColor: 'border-l-violet-500',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-700',
    },
    {
      icon: IconMoon,
      label: 'Avg Stay',
      value: `${summary.avg_stay_nights} nights`,
      sub: 'Per completed booking',
      accentColor: 'border-l-indigo-400',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-700',
    },
    {
      icon: IconWallet,
      label: 'Cash Revenue',
      value: peso(summary.cash_revenue),
      sub: 'Walk-in payments',
      accentColor: 'border-l-amber-500',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      icon: IconDeviceMobile,
      label: 'GCash Revenue',
      value: peso(summary.gcash_revenue),
      sub: 'Digital payments',
      accentColor: 'border-l-pink-500',
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} {...card} />
      ))}
    </div>
  );
}