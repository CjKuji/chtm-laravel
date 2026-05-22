import { supabase } from '@/lib/supabase';

export type AuditPeriod = 'daily' | 'monthly' | 'quarterly' | 'annual';

export interface RevenueRow {
  period: string;
  total_revenue: number;
  total_bookings: number;
  checked_out: number;
  cancelled: number;
  avg_revenue_per_booking: number;
  cash_revenue: number;
  gcash_revenue: number;
}

export interface RoomTypeBreakdown {
  room_type_name: string;
  bookings: number;
  revenue: number;
  avg_nights: number;
}

export interface OccupancyRow {
  room_number: string;
  room_type: string;
  floor: number;
  total_bookings: number;
  total_revenue: number;
  total_nights: number;
}

export interface AuditLogRow {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  reason: string;
  created_at: string;
  changer_name?: string;
}

export interface GuestStats {
  total_guests: number;
  with_children: number;
  with_pwd: number;
  with_senior: number;
  extra_beds: number;
}

export interface AuditSummary {
  total_revenue: number;
  total_bookings: number;
  checked_out: number;
  cancelled: number;
  pending: number;
  approved: number;
  occupancy_rate: number;
  avg_stay_nights: number;
  top_room_type: string;
  cash_revenue: number;
  gcash_revenue: number;
}

// ─── Date Range Helpers ───────────────────────────────────────────────────────

export function getDateRange(
  period: AuditPeriod,
  year: number,
  month?: number,
  quarter?: number
): { from: string; to: string; label: string } {
  if (period === 'daily' && month !== undefined) {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: from.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  }
  if (period === 'monthly') {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString(), label: `Year ${year}` };
  }
  if (period === 'quarterly' && quarter !== undefined) {
    const startMonth = (quarter - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0, 23, 59, 59);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: `Q${quarter} ${year}`,
    };
  }
  // annual
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31, 23, 59, 59);
  return { from: from.toISOString(), to: to.toISOString(), label: `Annual ${year}` };
}

// ─── Revenue / Sales ─────────────────────────────────────────────────────────

export async function fetchRevenueSummary(from: string, to: string): Promise<AuditSummary> {
  const [bookingsRes, archivedRes, roomsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('status, total_amount, payment_method, start_at, end_at')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('archived_bookings')
      .select('status, total_amount, payment_method, start_at, end_at')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase.from('rooms').select('id'),
  ]);

  const all = [...(bookingsRes.data ?? []), ...(archivedRes.data ?? [])];
  const totalRooms = roomsRes.data?.length ?? 1;

  const checkedOut = all.filter((b) => b.status === 'checked_out');
  const cancelled = all.filter((b) => b.status === 'cancelled' || b.status === 'rejected');
  const pending = all.filter((b) => b.status === 'pending');
  const approved = all.filter((b) => b.status === 'approved');

  const totalRevenue = checkedOut.reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const cashRevenue = checkedOut
    .filter((b) => b.payment_method?.toLowerCase() === 'cash')
    .reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const gcashRevenue = checkedOut
    .filter((b) => b.payment_method?.toLowerCase() === 'gcash')
    .reduce((s, b) => s + (b.total_amount ?? 0), 0);

  const avgNights =
    checkedOut.length > 0
      ? checkedOut.reduce((s, b) => {
          const nights =
            b.end_at && b.start_at
              ? Math.max(
                  1,
                  Math.round(
                    (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 1;
          return s + nights;
        }, 0) / checkedOut.length
      : 0;

  return {
    total_revenue: totalRevenue,
    total_bookings: all.length,
    checked_out: checkedOut.length,
    cancelled: cancelled.length,
    pending: pending.length,
    approved: approved.length,
    occupancy_rate: Math.min(100, (checkedOut.length / Math.max(1, totalRooms)) * 100),
    avg_stay_nights: Math.round(avgNights * 10) / 10,
    top_room_type: '',
    cash_revenue: cashRevenue,
    gcash_revenue: gcashRevenue,
  };
}

export async function fetchMonthlyRevenue(year: number): Promise<RevenueRow[]> {
  const from = new Date(year, 0, 1).toISOString();
  const to = new Date(year, 11, 31, 23, 59, 59).toISOString();

  const [bookingsRes, archivedRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('status, total_amount, payment_method, created_at')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('archived_bookings')
      .select('status, total_amount, payment_method, created_at')
      .gte('created_at', from)
      .lte('created_at', to),
  ]);

  const all = [...(bookingsRes.data ?? []), ...(archivedRes.data ?? [])];
  const months = Array.from({ length: 12 }, (_, i) => i);

  return months.map((m) => {
    const monthData = all.filter((b) => new Date(b.created_at).getMonth() === m);
    const checkedOut = monthData.filter((b) => b.status === 'checked_out');
    const revenue = checkedOut.reduce((s, b) => s + (b.total_amount ?? 0), 0);
    const cash = checkedOut
      .filter((b) => b.payment_method?.toLowerCase() === 'cash')
      .reduce((s, b) => s + (b.total_amount ?? 0), 0);
    const gcash = checkedOut
      .filter((b) => b.payment_method?.toLowerCase() === 'gcash')
      .reduce((s, b) => s + (b.total_amount ?? 0), 0);

    return {
      period: new Date(year, m, 1).toLocaleString('default', { month: 'long' }),
      total_revenue: revenue,
      total_bookings: monthData.length,
      checked_out: checkedOut.length,
      cancelled: monthData.filter(
        (b) => b.status === 'cancelled' || b.status === 'rejected'
      ).length,
      avg_revenue_per_booking: checkedOut.length > 0 ? revenue / checkedOut.length : 0,
      cash_revenue: cash,
      gcash_revenue: gcash,
    };
  });
}

export async function fetchQuarterlyRevenue(year: number): Promise<RevenueRow[]> {
  const monthly = await fetchMonthlyRevenue(year);
  return [0, 1, 2, 3].map((q) => {
    const slice = monthly.slice(q * 3, q * 3 + 3);
    return {
      period: `Q${q + 1} ${year}`,
      total_revenue: slice.reduce((s, r) => s + r.total_revenue, 0),
      total_bookings: slice.reduce((s, r) => s + r.total_bookings, 0),
      checked_out: slice.reduce((s, r) => s + r.checked_out, 0),
      cancelled: slice.reduce((s, r) => s + r.cancelled, 0),
      avg_revenue_per_booking:
        slice.reduce((s, r) => s + r.checked_out, 0) > 0
          ? slice.reduce((s, r) => s + r.total_revenue, 0) /
            slice.reduce((s, r) => s + r.checked_out, 0)
          : 0,
      cash_revenue: slice.reduce((s, r) => s + r.cash_revenue, 0),
      gcash_revenue: slice.reduce((s, r) => s + r.gcash_revenue, 0),
    };
  });
}

export async function fetchAnnualRevenue(fromYear: number, toYear: number): Promise<RevenueRow[]> {
  const results: RevenueRow[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    const from = new Date(y, 0, 1).toISOString();
    const to = new Date(y, 11, 31, 23, 59, 59).toISOString();
    const summary = await fetchRevenueSummary(from, to);
    results.push({
      period: String(y),
      total_revenue: summary.total_revenue,
      total_bookings: summary.total_bookings,
      checked_out: summary.checked_out,
      cancelled: summary.cancelled,
      avg_revenue_per_booking:
        summary.checked_out > 0 ? summary.total_revenue / summary.checked_out : 0,
      cash_revenue: summary.cash_revenue,
      gcash_revenue: summary.gcash_revenue,
    });
  }
  return results;
}

// ─── Room Type Breakdown ──────────────────────────────────────────────────────

export async function fetchRoomTypeBreakdown(
  from: string,
  to: string
): Promise<RoomTypeBreakdown[]> {
  const { data: archived } = await supabase
    .from('archived_bookings')
    .select('room_type_name, total_amount, start_at, end_at, status')
    .gte('created_at', from)
    .lte('created_at', to)
    .eq('status', 'checked_out');

  const map = new Map<string, { bookings: number; revenue: number; nights: number }>();
  (archived ?? []).forEach((b) => {
    const key = b.room_type_name ?? 'Unknown';
    const nights =
      b.end_at && b.start_at
        ? Math.max(
            1,
            Math.round(
              (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 1;
    const cur = map.get(key) ?? { bookings: 0, revenue: 0, nights: 0 };
    map.set(key, {
      bookings: cur.bookings + 1,
      revenue: cur.revenue + (b.total_amount ?? 0),
      nights: cur.nights + nights,
    });
  });

  return Array.from(map.entries()).map(([name, v]) => ({
    room_type_name: name,
    bookings: v.bookings,
    revenue: v.revenue,
    avg_nights: v.bookings > 0 ? Math.round((v.nights / v.bookings) * 10) / 10 : 0,
  }));
}

// ─── Occupancy by Room ────────────────────────────────────────────────────────

export async function fetchRoomOccupancy(from: string, to: string): Promise<OccupancyRow[]> {
  const { data: archived } = await supabase
    .from('archived_bookings')
    .select('room_number, room_type_name, room_floor, total_amount, start_at, end_at, status')
    .gte('created_at', from)
    .lte('created_at', to)
    .eq('status', 'checked_out');

  const map = new Map<
    string,
    { type: string; floor: number; bookings: number; revenue: number; nights: number }
  >();
  (archived ?? []).forEach((b) => {
    const key = b.room_number ?? 'N/A';
    const nights =
      b.end_at && b.start_at
        ? Math.max(
            1,
            Math.round(
              (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 1;
    const cur = map.get(key) ?? {
      type: b.room_type_name ?? 'N/A',
      floor: b.room_floor ?? 0,
      bookings: 0,
      revenue: 0,
      nights: 0,
    };
    map.set(key, {
      ...cur,
      bookings: cur.bookings + 1,
      revenue: cur.revenue + (b.total_amount ?? 0),
      nights: cur.nights + nights,
    });
  });

  return Array.from(map.entries())
    .map(([room_number, v]) => ({
      room_number,
      room_type: v.type,
      floor: v.floor,
      total_bookings: v.bookings,
      total_revenue: v.revenue,
      total_nights: v.nights,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue);
}

// ─── Guest Statistics ─────────────────────────────────────────────────────────

export async function fetchGuestStats(from: string, to: string): Promise<GuestStats> {
  const [bookingsRes, archivedRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('guests, has_child, has_pwd, has_senior, extra_beds')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('archived_bookings')
      .select('guests, has_child, has_pwd, has_senior, extra_beds')
      .gte('created_at', from)
      .lte('created_at', to),
  ]);

  const all = [...(bookingsRes.data ?? []), ...(archivedRes.data ?? [])];
  return {
    total_guests: all.reduce((s, b) => s + (b.guests ?? 0), 0),
    with_children: all.filter((b) => b.has_child).length,
    with_pwd: all.filter((b) => b.has_pwd).length,
    with_senior: all.filter((b) => b.has_senior).length,
    extra_beds: all.reduce((s, b) => s + (b.extra_beds ?? 0), 0),
  };
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function fetchAuditLogs(
  from: string,
  to: string,
  page = 0,
  pageSize = 20
): Promise<{ data: AuditLogRow[]; count: number }> {
  const { data, count } = await supabase
    .from('audit_logs')
    .select(
      `id, entity_type, entity_id, action, old_value, new_value, changed_by, reason, created_at`,
      { count: 'exact' }
    )
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  // Enrich with user names
  const rows: AuditLogRow[] = [];
  const userIds = [...new Set((data ?? []).map((r) => r.changed_by).filter(Boolean))];
  let userMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, fname, lname')
      .in('id', userIds);
    (users ?? []).forEach((u) => {
      userMap[u.id] = `${u.fname} ${u.lname}`;
    });
  }

  (data ?? []).forEach((r) => {
    rows.push({ ...r, changer_name: userMap[r.changed_by] ?? r.changed_by ?? '—' });
  });

  return { data: rows, count: count ?? 0 };
}