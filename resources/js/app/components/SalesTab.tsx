import { RevenueRow, RoomTypeBreakdown } from '../services/auditService';

interface Props {
  rows: RevenueRow[];
  roomTypes: RoomTypeBreakdown[];
  loading: boolean;
}

const peso = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function SalesTab({ rows, roomTypes, loading }: Props) {
  const maxRevenue = Math.max(...rows.map((r) => r.total_revenue), 1);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const grandTotal = rows.reduce((s, r) => s + r.total_revenue, 0);
  const grandBookings = rows.reduce((s, r) => s + r.total_bookings, 0);
  const grandOut = rows.reduce((s, r) => s + r.checked_out, 0);
  const grandCancelled = rows.reduce((s, r) => s + r.cancelled, 0);
  const grandCash = rows.reduce((s, r) => s + r.cash_revenue, 0);
  const grandGCash = rows.reduce((s, r) => s + r.gcash_revenue, 0);

  return (
    <div className="space-y-6">
      {/* Revenue Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Revenue Breakdown</h3>
          <p className="text-xs text-gray-500">Completed bookings only (checked out status)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Checked Out</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cancelled</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cash</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">GCash</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No revenue data for this period
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.period}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{r.total_bookings}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-emerald-700 font-semibold">{r.checked_out}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-red-500 font-semibold">{r.cancelled}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 text-xs">{peso(r.cash_revenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 text-xs">{peso(r.gcash_revenue)}</td>
                  <td className="px-4 py-3 text-right font-bold text-teal-700">{peso(r.total_revenue)}</td>
                  <td className="px-4 py-3">
                    <MiniBar value={r.total_revenue} max={maxRevenue} color="bg-teal-500" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-teal-50 border-t-2 border-teal-200 font-bold">
                <td className="px-4 py-3 text-teal-800">TOTAL</td>
                <td className="px-4 py-3 text-right text-teal-800">{grandBookings}</td>
                <td className="px-4 py-3 text-right text-teal-800">{grandOut}</td>
                <td className="px-4 py-3 text-right text-teal-800">{grandCancelled}</td>
                <td className="px-4 py-3 text-right text-teal-800 text-xs">{peso(grandCash)}</td>
                <td className="px-4 py-3 text-right text-teal-800 text-xs">{peso(grandGCash)}</td>
                <td className="px-4 py-3 text-right text-teal-800 text-lg">{peso(grandTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Room Type Revenue */}
      {roomTypes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Revenue by Room Type</h3>
            <p className="text-xs text-gray-500">Breakdown from archived checked-out bookings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Nights</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg/Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roomTypes.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.room_type_name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.bookings}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.avg_nights}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-700">{peso(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {r.bookings > 0 ? peso(r.revenue / r.bookings) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
