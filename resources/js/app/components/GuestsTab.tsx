import { GuestStats } from '../services/auditService';

interface Props {
  stats: GuestStats | null;
  loading: boolean;
}

function StatRow({
  icon, label, value, color,
}: {
  icon: string; label: string; value: number; color: string;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${color}`}>
      <span className="text-3xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
      </div>
      <span className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</span>
    </div>
  );
}

export default function GuestsTab({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
        <p className="text-4xl mb-3">👥</p>
        <p>No guest data available for this period</p>
      </div>
    );
  }

  const total = stats.total_guests || 1;
  const specialCount = stats.with_children + stats.with_pwd + stats.with_senior;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5">Guest Statistics Overview</h3>
        <div className="space-y-3">
          <StatRow
            icon="👥"
            label="Total Guest Count (all bookings in period)"
            value={stats.total_guests}
            color="bg-blue-50 border-blue-200"
          />
          <StatRow
            icon="👶"
            label="Bookings with Children"
            value={stats.with_children}
            color="bg-amber-50 border-amber-200"
          />
          <StatRow
            icon="♿"
            label="Bookings with PWD Guest"
            value={stats.with_pwd}
            color="bg-purple-50 border-purple-200"
          />
          <StatRow
            icon="🧓"
            label="Bookings with Senior Guest"
            value={stats.with_senior}
            color="bg-orange-50 border-orange-200"
          />
          <StatRow
            icon="🛏️"
            label="Extra Beds Requested"
            value={stats.extra_beds}
            color="bg-teal-50 border-teal-200"
          />
        </div>
      </div>

      {/* Special Needs Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5">Special Needs Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'With Children', value: stats.with_children, icon: '👶', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'PWD', value: stats.with_pwd, icon: '♿', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Senior', value: stats.with_senior, icon: '🧓', color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((item) => {
            const pct = specialCount > 0 ? Math.round((item.value / specialCount) * 100) : 0;
            return (
              <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
                <div className="text-4xl mb-2">{item.icon}</div>
                <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {pct}% of special-needs bookings
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
        <strong>Note:</strong> Guest counts are based on all bookings (both active and archived) created within the selected period.
        "Bookings with..." counts how many booking records had that flag enabled, not the number of individual guests.
      </div>
    </div>
  );
}
