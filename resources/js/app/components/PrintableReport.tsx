import { AuditSummary, RevenueRow, RoomTypeBreakdown, OccupancyRow, GuestStats } from '../services/auditService';

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
  const totalRevenue = revenueRows.reduce((s, r) => s + r.total_revenue, 0);
  const totalBookings = revenueRows.reduce((s, r) => s + r.total_bookings, 0);
  const totalCheckouts = revenueRows.reduce((s, r) => s + r.checked_out, 0);
  const totalCancelled = revenueRows.reduce((s, r) => s + r.cancelled, 0);

  return (
    <div ref={printRef} style={{ display: 'none' }}>
      {/* Header */}
      <div className="print-header">
        <div>
          <div className="hotel-name">🏨 CHTM RRS</div>
          <div className="hotel-sub">Hotel Management System</div>
        </div>
        <div className="report-meta">
          <strong>Audit Report</strong>
          <span>Period: {dateLabel}</span>
          <br />
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-grid">
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value green">{peso(summary.total_revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{summary.total_bookings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Checked Out</div>
            <div className="stat-value green">{summary.checked_out}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cancelled</div>
            <div className="stat-value red">{summary.cancelled}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Occupancy Rate</div>
            <div className="stat-value">{summary.occupancy_rate.toFixed(1)}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Stay (nights)</div>
            <div className="stat-value">{summary.avg_stay_nights}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cash Revenue</div>
            <div className="stat-value">{peso(summary.cash_revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">GCash Revenue</div>
            <div className="stat-value">{peso(summary.gcash_revenue)}</div>
          </div>
        </div>
      )}

      {/* Revenue Breakdown Table */}
      <div className="section">
        <h2>Revenue Breakdown — {dateLabel}</h2>
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
              <th>Avg/Booking</th>
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
              <td>TOTAL</td>
              <td>{totalBookings}</td>
              <td>{totalCheckouts}</td>
              <td>{totalCancelled}</td>
              <td>{peso(revenueRows.reduce((s, r) => s + r.cash_revenue, 0))}</td>
              <td>{peso(revenueRows.reduce((s, r) => s + r.gcash_revenue, 0))}</td>
              <td>{peso(totalRevenue)}</td>
              <td>{totalCheckouts > 0 ? peso(totalRevenue / totalCheckouts) : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Room Type Breakdown */}
      {roomTypeBreakdown.length > 0 && (
        <div className="section">
          <h2>Revenue by Room Type</h2>
          <table>
            <thead>
              <tr>
                <th>Room Type</th>
                <th>Bookings</th>
                <th>Avg Nights</th>
                <th>Revenue</th>
                <th>Avg/Booking</th>
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
        <div className="section">
          <h2>Top Rooms by Revenue</h2>
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
        <div className="section">
          <h2>Guest Statistics</h2>
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
    </div>
  );
}
