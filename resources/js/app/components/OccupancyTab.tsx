import { OccupancyRow } from '@/app/services/audit.service';

interface Props {
  rows: OccupancyRow[];
  loading: boolean;
}

const peso = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function OccupancyTab({ rows, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const maxRevenue = Math.max(...rows.map((r) => r.total_revenue), 1);

  return (
    <div className="space-y-6">
      {rows.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🏠</p>
          <p>No occupancy data for this period</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800">Room Occupancy Report</h3>
              <p className="text-xs text-gray-500">Sorted by revenue. Checked-out bookings only.</p>
            </div>
            <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full font-semibold">
              {rows.length} rooms
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Floor</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Nights</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Revenue Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => {
                  const pct = maxRevenue > 0 ? Math.round((r.total_revenue / maxRevenue) * 100) : 0;
                  return (
                    <tr key={r.room_number} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg text-xs">
                          {r.room_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.room_type}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{r.floor}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{r.total_bookings}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{r.total_nights}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{peso(r.total_revenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
                  <td colSpan={4} className="px-4 py-3 text-emerald-800">TOTAL</td>
                  <td className="px-4 py-3 text-right text-emerald-800">
                    {rows.reduce((s, r) => s + r.total_bookings, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-800">
                    {rows.reduce((s, r) => s + r.total_nights, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-800 text-base">
                    {peso(rows.reduce((s, r) => s + r.total_revenue, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
