import { RevenueRow, RoomTypeBreakdown } from '@/app/services/audit.service';

interface Props {
  rows: RevenueRow[];
  roomTypes: RoomTypeBreakdown[];
  loading: boolean;
}

const peso = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

function MiniBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
    </div>
  );
}

export default function SalesTab({ rows, roomTypes, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  const maxRevenue = Math.max(...rows.map((r) => r.total_revenue), 1);

  const grandTotal     = rows.reduce((s, r) => s + r.total_revenue, 0);
  const grandBookings  = rows.reduce((s, r) => s + r.total_bookings, 0);
  const grandOut       = rows.reduce((s, r) => s + r.checked_out, 0);
  const grandCancelled = rows.reduce((s, r) => s + r.cancelled, 0);
  const grandCash      = rows.reduce((s, r) => s + r.cash_revenue, 0);
  const grandGCash     = rows.reduce((s, r) => s + r.gcash_revenue, 0);

  return (
    <div className="space-y-5">

      {/* Revenue Breakdown */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Revenue Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Completed bookings only — checked-out status</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <i className="ti ti-cash text-green-700 text-[14px]" aria-hidden="true" />
            <span className="text-xs text-green-800 font-medium">{peso(grandTotal)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  { label: 'Period',       align: 'left'  },
                  { label: 'Bookings',     align: 'right' },
                  { label: 'Checked Out',  align: 'right' },
                  { label: 'Cancelled',    align: 'right' },
                  { label: 'Cash',         align: 'right' },
                  { label: 'GCash',        align: 'right' },
                  { label: 'Revenue',      align: 'right' },
                  { label: 'Bar',          align: 'left'  },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={`px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-widest text-${h.align}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <i className="ti ti-chart-bar-off text-[32px] text-gray-300" aria-hidden="true" />
                      <span className="text-sm">No revenue data for this period</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.period}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{r.total_bookings}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-700 font-medium">{r.checked_out}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-red-500 font-medium">{r.cancelled}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{peso(r.cash_revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{peso(r.gcash_revenue)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-800">{peso(r.total_revenue)}</td>
                    <td className="px-4 py-3 w-32">
                      <MiniBar value={r.total_revenue} max={maxRevenue} colorClass="bg-green-600" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-green-50 border-t border-green-200">
                  <td className="px-4 py-3 text-xs font-medium text-green-800 uppercase tracking-wide">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-800">{grandBookings}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-800">{grandOut}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-800">{grandCancelled}</td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-green-800">{peso(grandCash)}</td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-green-800">{peso(grandGCash)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-800">{peso(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Room Type Revenue */}
      {roomTypes.length > 0 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Revenue by Room Type</h3>
            <p className="text-xs text-gray-400 mt-0.5">Breakdown from archived checked-out bookings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Room Type', 'Bookings', 'Avg Nights', 'Revenue', 'Avg / Booking'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-widest
                        ${i === 0 ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roomTypes.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.room_type_name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{r.bookings}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{r.avg_nights}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-800">{peso(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
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