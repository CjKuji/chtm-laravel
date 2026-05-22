import {
  IconChartDots,
  IconHeartRateMonitor,
  IconUsers,
  IconBabyCarriage,
  IconWheelchair,
  IconUserHeart,
  IconBed,
  IconInfoCircle,
} from '@tabler/icons-react';
import { GuestStats } from '@/app/services/audit.service';

interface Props {
  stats: GuestStats | null;
  loading: boolean;
}

/* ── Compact stat row ──────────────────────────────────────────────────── */
function StatRow({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-100 bg-white hover:shadow-[0_2px_10px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accentClass}`}>
        <Icon size={17} />
      </div>
      <p className="flex-1 text-sm font-medium text-gray-700 leading-snug">{label}</p>
      <span className="text-xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

/* ── Donut-style metric card ───────────────────────────────────────────── */
function ShareCard({
  icon: Icon,
  label,
  value,
  pct,
  iconClass,
  bg,
  textColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  pct: number;
  iconClass: string;
  bg: string;
  textColor: string;
}) {
  return (
    <div className={`${bg} rounded-xl border border-gray-100 p-5 flex flex-col items-center gap-2 text-center`}>
      <div className={`w-10 h-10 rounded-xl ${iconClass} flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <p className={`text-2xl font-bold ${textColor} tabular-nums`}>{value.toLocaleString()}</p>
      <p className="text-[13px] font-medium text-gray-600">{label}</p>
      {/* Bar */}
      <div className="w-full mt-1">
        <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${textColor.replace('text-', 'bg-')}`}
            style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-1">{pct}% of special-needs bookings</p>
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function GuestsTab({ stats, loading }: Props) {
  if (loading) return <Skeleton />;

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <IconUsers size={28} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">No guest data available</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting the selected period</p>
      </div>
    );
  }

  const specialCount = stats.with_children + stats.with_pwd + stats.with_senior || 1;
  const toShare = (n: number) => Math.round((n / specialCount) * 100);

  const overviewRows = [
    {
      icon: IconUsers,
      label: 'Total Guest Count (all bookings in period)',
      value: stats.total_guests,
      accentClass: 'bg-blue-50 text-blue-600',
    },
    {
      icon: IconBabyCarriage,
      label: 'Bookings with Children',
      value: stats.with_children,
      accentClass: 'bg-amber-50 text-amber-600',
    },
    {
      icon: IconWheelchair,
      label: 'Bookings with PWD Guest',
      value: stats.with_pwd,
      accentClass: 'bg-violet-50 text-violet-600',
    },
    {
      icon: IconUserHeart,
      label: 'Bookings with Senior Guest',
      value: stats.with_senior,
      accentClass: 'bg-orange-50 text-orange-600',
    },
    {
      icon: IconBed,
      label: 'Extra Beds Requested',
      value: stats.extra_beds,
      accentClass: 'bg-teal-50 text-teal-600',
    },
  ];

  const shareCards = [
    {
      icon: IconBabyCarriage,
      label: 'With Children',
      value: stats.with_children,
      pct: toShare(stats.with_children),
      iconClass: 'bg-amber-100 text-amber-600',
      bg: 'bg-amber-50/60',
      textColor: 'text-amber-600',
    },
    {
      icon: IconWheelchair,
      label: 'PWD',
      value: stats.with_pwd,
      pct: toShare(stats.with_pwd),
      iconClass: 'bg-violet-100 text-violet-600',
      bg: 'bg-violet-50/60',
      textColor: 'text-violet-600',
    },
    {
      icon: IconUserHeart,
      label: 'Senior',
      value: stats.with_senior,
      pct: toShare(stats.with_senior),
      iconClass: 'bg-orange-100 text-orange-600',
      bg: 'bg-orange-50/60',
      textColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-5">

      {/* ── Overview ───────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <IconChartDots size={14} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Guest Statistics Overview</h3>
        </div>
        <div className="space-y-2">
          {overviewRows.map((row) => (
            <StatRow key={row.label} {...row} />
          ))}
        </div>
      </section>

      {/* ── Special Needs Breakdown ─────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
            <IconHeartRateMonitor size={14} className="text-violet-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Special Needs Breakdown</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {shareCards.map((card) => (
            <ShareCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* ── Footer Note ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
        <IconInfoCircle size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p>
          Guest counts are based on all bookings (active and archived) created within the selected period.
          "Bookings with..." counts how many booking records had that flag enabled,
          not the number of individual guests.
        </p>
      </div>
    </div>
  );
}