import { supabase } from '@/lib/supabase';

/* ── Types ──────────────────────────────────────────────────────────── */

export interface DashboardUser {
  id: string;
  email: string;
  fname: string;
  lname: string;
  role: string;
}

export interface OccupiedRoom {
  id: number;
  start_at: string;
  end_at: string;
  checked_in_at: string;
  guest_name: string;
  room_number: string;
  room_type: string;
  nights_so_far: number;
}

export interface UpcomingBooking {
  id: number;
  start_at: string;
  end_at: string;
  guest_name: string;
  room_number: string;
  room_type: string;
  nights: number;
}

export interface RoomStatusSummary {
  total: number;
  occupied: number;
  available: number;
  needsCleaning: number;
  occupancyPct: number;
}

export interface RecentActivity {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  created_at: string;
  changed_by: string | null;
}

export interface DashboardData {
  user: DashboardUser;
  roomStatus: RoomStatusSummary;
  occupiedRooms: OccupiedRoom[];
  upcomingBookings: UpcomingBooking[];
  recentActivity: RecentActivity[];
  pendingCount: number;
  checkoutsToday: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function fullName(u: { fname?: string; lname?: string } | null): string {
  if (!u) return 'Unknown';
  return `${u.fname ?? ''} ${u.lname ?? ''}`.trim() || 'Unknown';
}

function nightsBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

function nightsSoFar(checkedInAt: string): number {
  const diff = Date.now() - new Date(checkedInAt).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

/* ── Auth ────────────────────────────────────────────────────────────── */

export async function getAuthenticatedUser(): Promise<DashboardUser> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('unauthenticated');

  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('fname, lname, role, email')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    await supabase.auth.signOut();
    throw new Error('profile_missing');
  }

  return {
    id:    user.id,
    email: profile.email ?? user.email ?? '',
    fname: profile.fname,
    lname: profile.lname,
    role:  profile.role,
  };
}

/* ── Dashboard data ──────────────────────────────────────────────────── */

export async function fetchDashboardData(
  _userId: string
): Promise<Omit<DashboardData, 'user'>> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const [
    allRoomsRes,
    occupiedRoomsRes,      // rooms.status = 'occupied'  (source of truth)
    needsCleaningRes,
    occupiedBookingsRes,   // active check-ins for the table
    upcomingRes,
    pendingRes,
    checkoutTodayRes,
    activityRes,
  ] = await Promise.all([

    /* ── total room count ─────────────────────────────────────────── */
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true }),

    /* ── rooms currently marked occupied (canonical source) ───────── */
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'occupied'),

    /* ── rooms needing cleaning ───────────────────────────────────── */
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'needs_cleaning'),

    /* ── active bookings with checked-in guests (for the table) ───── */
    supabase
      .from('bookings')
      .select(`
        id, start_at, end_at, checked_in_at,
        users ( fname, lname ),
        rooms ( room_number, room_types ( name ) )
      `)
      .eq('status', 'checked_in'),

    /* ── upcoming approved bookings ───────────────────────────────── */
    supabase
      .from('bookings')
      .select(`
        id, start_at, end_at,
        users ( fname, lname ),
        rooms ( room_number, room_types ( name ) )
      `)
      .gt('start_at', now.toISOString())
      .eq('status', 'approved')
      .order('start_at', { ascending: true })
      .limit(8),

    /* ── pending bookings count ───────────────────────────────────── */
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    /* ── checkouts due today ──────────────────────────────────────── */
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('end_at', todayStart)
      .lt('end_at', todayEnd)
      .eq('status', 'checked_in'),

    /* ── recent audit activity ────────────────────────────────────── */
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, created_at, changed_by')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const total        = allRoomsRes.count        ?? 0;
  const occupied     = occupiedRoomsRes.count   ?? 0;
  const needsCleaning = needsCleaningRes.count  ?? 0;
  const available    = Math.max(0, total - occupied - needsCleaning);

  const occupiedRooms: OccupiedRoom[] = (occupiedBookingsRes.data ?? []).map(
    (b: any) => ({
      id:            b.id,
      start_at:      b.start_at,
      end_at:        b.end_at,
      checked_in_at: b.checked_in_at,
      guest_name:    fullName(b.users),
      room_number:   b.rooms?.room_number      ?? '—',
      room_type:     b.rooms?.room_types?.name ?? 'Unknown',
      nights_so_far: nightsSoFar(b.checked_in_at),
    })
  );

  const upcomingBookings: UpcomingBooking[] = (upcomingRes.data ?? []).map(
    (b: any) => ({
      id:          b.id,
      start_at:    b.start_at,
      end_at:      b.end_at,
      guest_name:  fullName(b.users),
      room_number: b.rooms?.room_number      ?? '—',
      room_type:   b.rooms?.room_types?.name ?? 'Unknown',
      nights:      nightsBetween(b.start_at, b.end_at),
    })
  );

  const recentActivity: RecentActivity[] = (activityRes.data ?? []).map(
    (a: any) => ({
      id:          a.id,
      action:      a.action,
      entity_type: a.entity_type,
      entity_id:   a.entity_id,
      created_at:  a.created_at,
      changed_by:  a.changed_by ?? null,
    })
  );

  return {
    roomStatus: {
      total,
      occupied,
      available,
      needsCleaning,
      occupancyPct: total > 0 ? Math.round((occupied / total) * 100) : 0,
    },
    occupiedRooms,
    upcomingBookings,
    recentActivity,
    pendingCount:   pendingRes.count      ?? 0,
    checkoutsToday: checkoutTodayRes.count ?? 0,
  };
}