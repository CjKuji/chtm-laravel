import {
  AuditSummary,
  RevenueRow,
  RoomTypeBreakdown,
  OccupancyRow,
  GuestStats,
} from '@/app/services/audit.service';

interface Props {
  printRef: React.RefObject<HTMLDivElement>;
  dateLabel: string;
  summary: AuditSummary | null;
  revenueRows: RevenueRow[];
  roomTypeBreakdown: RoomTypeBreakdown[];
  occupancyRows: OccupancyRow[];
  guestStats: GuestStats | null;
}

const peso = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function PrintableReport({
  printRef,
  dateLabel,
  summary,
  revenueRows,
  roomTypeBreakdown,
  occupancyRows,
  guestStats,
}: Props) {
  const totalRevenue   = revenueRows.reduce((s, r) => s + r.total_revenue, 0);
  const totalBookings  = revenueRows.reduce((s, r) => s + r.total_bookings, 0);
  const totalCheckouts = revenueRows.reduce((s, r) => s + r.checked_out, 0);
  const totalCancelled = revenueRows.reduce((s, r) => s + r.cancelled, 0);
  const totalCash      = revenueRows.reduce((s, r) => s + r.cash_revenue, 0);
  const totalGCash     = revenueRows.reduce((s, r) => s + r.gcash_revenue, 0);

  return (
    <div ref={printRef} style={{ display: 'none' }}>
      <style>{`
        @media print {
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111; background: #fff; }

          .pr-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 32px 16px; border-bottom: 2px solid #166534; margin-bottom: 20px; }
          .pr-hotel-name { font-size: 18px; font-weight: 700; color: #166534; }
          .pr-hotel-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
          .pr-meta { text-align: right; font-size: 11px; color: #6b7280; line-height: 1.6; }
          .pr-meta strong { display: block; font-size: 13px; color: #111; margin-bottom: 2px; }

          .pr-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 0 32px 20px; }
          .pr-kpi { background: #f9fafb; border: 0.5px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; border-left: 3px solid #166534; }
          .pr-kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 4px; }
          .pr-kpi-value { font-size: 16px; font-weight: 600; color: #111; }
          .pr-kpi-value.green { color: #166534; }
          .pr-kpi-value.red { color: #b91c1c; }

          .pr-section { padding: 0 32px 24px; }
          .pr-section-title { font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 0.5px solid #d1fae5; padding-bottom: 6px; margin-bottom: 12px; }

          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          thead tr { background: #f0fdf4; }
          th { text-align: left; padding: 7px 10px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; border-bottom: 0.5px solid #d1d5db; }
          th:not(:first-child) { text-align: right; }
          td { padding: 7px 10px; border-bottom: 0.5px solid #f3f4f6; color: #374151; }
          td:not(:first-child) { text-align: right; }
          tfoot td { background: #f0fdf4; font-weight: 600; color: #166534; border-top: 1px solid #bbf7d0; }

          .pr-footer { padding: 16px 32px; border-top: 0.5px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; margin-top: 8px; }
        }
      `}</style>

      {/* Header */}
      <div className="pr-header">
        <div>
          <div className="pr-hotel-name">CHTM RRS</div>
          <div className="pr-hotel-sub">Hotel Management System — Audit Report</div>
        </div>
        <div className="pr-meta">
          <strong>Period: {dateLabel}</strong>
          Generated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="pr-kpi-grid">
          <div className="pr-kpi">
            <div className="pr-kpi-label">Total Revenue</div>
            <div className="pr-kpi-value green">{peso(summary.total_revenue)}</div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-label">Total Bookings</div>
            <div className="pr-kpi-value">{summary.total_bookings}</div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-label">Checked Out</div>
            <div className="pr-kpi-value green">{summary.checked_out}</div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-label">Cancelled</div>
            <div className="pr-kpi-value red">{summary.cancelled}</div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-label">Occupancy Rate</div>
            <div className="pr-kpi-value">{summary.occupancy_rate.toFixed(1)}%</div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-label">Avg Stay</div>
            <div className="pr-kpi-value">{summary.avg_stay_nights} nights</div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-label">Cash Revenue</div>
            <div className="pr-kpi-value">{peso(summary.cash_revenue)}</div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-label">GCash Revenue</div>
            <div className="pr-kpi-value">{peso(summary.gcash_revenue)}</div>
          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      <div className="pr-section">
        <div className="pr-section-title">Revenue Breakdown — {dateLabel}</div>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Bookings</th>
              <th>Checked Out</th>
              <th>Cancelled</th>
              <th>Cash</th>
              <th>GCash</th>
              <th>Total Revenue</th>
              <th>Avg / Booking</th>
            </tr>
          </thead>
          <tbody>
            {revenueRows.map((r, i) => (
              <tr key={i}>
                <td>{r.period}</td>
                <td>{r.total_bookings}</td>
                <td>{r.checked_out}</td>
                <td>{r.cancelled}</td>
                <td>{peso(r.cash_revenue)}</td>
                <td>{peso(r.gcash_revenue)}</td>
                <td>{peso(r.total_revenue)}</td>
                <td>{peso(r.avg_revenue_per_booking)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{totalBookings}</td>
              <td>{totalCheckouts}</td>
              <td>{totalCancelled}</td>
              <td>{peso(totalCash)}</td>
              <td>{peso(totalGCash)}</td>
              <td>{peso(totalRevenue)}</td>
              <td>{totalCheckouts > 0 ? peso(totalRevenue / totalCheckouts) : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Room Type Breakdown */}
      {roomTypeBreakdown.length > 0 && (
        <div className="pr-section">
          <div className="pr-section-title">Revenue by Room Type</div>
          <table>
            <thead>
              <tr>
                <th>Room Type</th>
                <th>Bookings</th>
                <th>Avg Nights</th>
                <th>Revenue</th>
                <th>Avg / Booking</th>
              </tr>
            </thead>
            <tbody>
              {roomTypeBreakdown.map((r, i) => (
                <tr key={i}>
                  <td>{r.room_type_name}</td>
                  <td>{r.bookings}</td>
                  <td>{r.avg_nights}</td>
                  <td>{peso(r.revenue)}</td>
                  <td>{r.bookings > 0 ? peso(r.revenue / r.bookings) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Rooms */}
      {occupancyRows.length > 0 && (
        <div className="pr-section">
          <div className="pr-section-title">Top Rooms by Revenue</div>
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Bookings</th>
                <th>Total Nights</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {occupancyRows.slice(0, 15).map((r, i) => (
                <tr key={i}>
                  <td>{r.room_number}</td>
                  <td>{r.room_type}</td>
                  <td>{r.floor}</td>
                  <td>{r.total_bookings}</td>
                  <td>{r.total_nights}</td>
                  <td>{peso(r.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guest Statistics */}
      {guestStats && (
        <div className="pr-section">
          <div className="pr-section-title">Guest Statistics</div>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Total Guest Count</td><td>{guestStats.total_guests}</td></tr>
              <tr><td>Bookings with Children</td><td>{guestStats.with_children}</td></tr>
              <tr><td>Bookings with PWD</td><td>{guestStats.with_pwd}</td></tr>
              <tr><td>Bookings with Senior</td><td>{guestStats.with_senior}</td></tr>
              <tr><td>Extra Beds Requested</td><td>{guestStats.extra_beds}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="pr-footer">
        <span>CHTM RRS — Hotel Management System</span>
        <span>Printed: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}