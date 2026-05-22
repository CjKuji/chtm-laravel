import {
  IconRefresh,
  IconBuildingSkyscraper,
  IconUsers,
  IconDoorEnter,
  IconCalendarClock,
  IconClockHour4,
  IconArrowRight,
  IconBed,
  IconLayoutDashboard,
  IconAlertCircle,
  IconHistory,
  IconCircleDot,
  IconSpray,
} from '@tabler/icons-react';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import { useSidebar } from '@/app/context/SidebarContext';
import { useDashboard } from '@/app/hooks/useDashboard';
import type {
  OccupiedRoom,
  UpcomingBooking,
  RecentActivity,
} from '@/app/services/dashboard.service';

/* ── Helpers ──────────────────────────────────────────────────────── */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit',
  });
}

function daysUntil(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return `In ${d}d`;
}

function daysUntilColor(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (d <= 0) return 'bg-amber-50 text-amber-600';
  if (d === 1) return 'bg-blue-50 text-blue-600';
  return 'bg-gray-100 text-gray-500';
}

function actionLabel(action: string, entityType: string) {
  const e = (entityType ?? 'record').replace(/_/g, ' ');
  const map: Record<string, string> = {
    INSERT:     `New ${e} created`,
    UPDATE:     `${e} updated`,
    DELETE:     `${e} deleted`,
    CHECK_IN:   'Guest checked in',
    CHECK_OUT:  'Guest checked out',
    APPROVED:   'Booking approved',
    REJECTED:   'Booking rejected',
    CANCELLED:  'Booking cancelled',
  };
  return map[action?.toUpperCase()] ?? `${action} on ${e}`;
}

function actionStyle(action: string): {
  bg: string; text: string; icon: React.ElementType;
} {
  const a = action?.toUpperCase();
  if (a === 'CHECK_IN' || a === 'APPROVED')
    return { bg: 'bg-teal-50',   text: 'text-teal-600',   icon: IconDoorEnter   };
  if (a === 'CHECK_OUT')
    return { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: IconArrowRight  };
  if (a === 'DELETE' || a === 'REJECTED' || a === 'CANCELLED')
    return { bg: 'bg-rose-50',   text: 'text-rose-500',   icon: IconAlertCircle };
  if (a === 'INSERT')
    return { bg: 'bg-violet-50', text: 'text-violet-600', icon: IconCircleDot   };
  return   { bg: 'bg-gray-100', text: 'text-gray-500',   icon: IconHistory     };
}

/* ── Sub-components ──────────────────────────────────────────────── */

function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconText,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconText: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={20} className={iconText} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function OccupancyBar({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? 'bg-rose-500' :
    pct >= 60 ? 'bg-amber-400' :
    'bg-teal-500';
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SectionHeader({
  icon: Icon, title,
}: {
  icon: React.ElementType; title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
        <Icon size={14} className="text-gray-500" />
      </div>
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
        <IconBed size={22} className="text-gray-300" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────── */

function DashboardSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
      <Topbar />
      <div className="pt-16 px-6 py-8 max-w-7xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded-xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />
          ))}
        </div>
        <div className="h-10 bg-white rounded-2xl border border-gray-100" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="h-72 bg-white rounded-2xl border border-gray-100" />
          <div className="h-72 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */

export default function Dashboard() {
  const { collapsed } = useSidebar();
  const { state, refresh } = useDashboard();

  /* ── Loading / auth ──────────────────────────────────────────── */
  if (state.phase === 'auth' || state.phase === 'loading') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar activeMenu="dashboard" />
        <DashboardSkeleton collapsed={collapsed} />
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────── */
  if (state.phase === 'error') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar activeMenu="dashboard" />
        <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
          <Topbar />
          <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
                <IconAlertCircle size={26} className="text-rose-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">{state.message}</p>
              <button
                onClick={refresh}
                className="text-xs text-teal-600 hover:underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Ready ───────────────────────────────────────────────────── */
  const { data } = state;
  const {
    roomStatus,
    occupiedRooms,
    upcomingBookings,
    recentActivity,
    pendingCount,
    checkoutsToday,
  } = data;

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeMenu="dashboard" />

      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar />

        <div className="pt-16">

          {/* ── Page header ──────────────────────────────────────── */}
          <header className="bg-white border-b border-gray-100 px-6 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                  <IconLayoutDashboard size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">
                    Dashboard
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Welcome back,{' '}
                    <span className="font-medium text-gray-600">{data.user.fname}</span>
                    {' · '}{today}
                  </p>
                </div>
              </div>

              <button
                onClick={refresh}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
              >
                <IconRefresh size={13} />
                Refresh
              </button>
            </div>
          </header>

          <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">

            {/* ── KPI row (5 cards) ─────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                label="Total Rooms"
                value={roomStatus.total}
                sub="All inventory"
                icon={IconBuildingSkyscraper}
                iconBg="bg-blue-50"
                iconText="text-blue-600"
              />
              <KpiCard
                label="Occupied"
                value={roomStatus.occupied}
                sub={`${roomStatus.occupancyPct}% occupancy`}
                icon={IconUsers}
                iconBg="bg-rose-50"
                iconText="text-rose-500"
              />
              <KpiCard
                label="Available"
                value={roomStatus.available}
                sub="Ready for check-in"
                icon={IconDoorEnter}
                iconBg="bg-teal-50"
                iconText="text-teal-600"
              />
              <KpiCard
                label="Needs Cleaning"
                value={roomStatus.needsCleaning}
                sub="Awaiting housekeeping"
                icon={IconSpray}
                iconBg="bg-amber-50"
                iconText="text-amber-600"
              />
              <KpiCard
                label="Pending"
                value={pendingCount}
                sub={`${checkoutsToday} checkout${checkoutsToday !== 1 ? 's' : ''} today`}
                icon={IconCalendarClock}
                iconBg="bg-violet-50"
                iconText="text-violet-600"
              />
            </div>

            {/* ── Occupancy bar ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap w-20">
                Occupancy
              </span>
              <div className="flex-1">
                <OccupancyBar pct={roomStatus.occupancyPct} />
              </div>
              <span className="text-sm font-bold text-gray-800 tabular-nums">
                {roomStatus.occupancyPct}%
              </span>
              <span className="text-xs text-gray-400">
                {roomStatus.occupied} / {roomStatus.total}
              </span>
            </div>

            {/* ── Tables ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {/* Currently occupied */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-5">
                <SectionHeader icon={IconUsers} title="Currently occupied" />

                {occupiedRooms.length === 0 ? (
                  <EmptyState label="No rooms currently occupied" />
                ) : (
                  <div className="space-y-1 overflow-y-auto max-h-72">
                    {occupiedRooms.map((b: OccupiedRoom) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-rose-500">
                            {b.guest_name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {b.guest_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {b.room_type} · Room {b.room_number}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium text-gray-700">
                            {fmtDate(b.start_at)} → {fmtDate(b.end_at)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <IconClockHour4 size={11} className="text-gray-300" />
                            <span className="text-[11px] text-gray-400">
                              {b.nights_so_far} night{b.nights_so_far !== 1 ? 's' : ''} so far
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming reservations */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-5">
                <SectionHeader icon={IconCalendarClock} title="Upcoming reservations" />

                {upcomingBookings.length === 0 ? (
                  <EmptyState label="No upcoming reservations" />
                ) : (
                  <div className="space-y-1 overflow-y-auto max-h-72">
                    {upcomingBookings.map((b: UpcomingBooking) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-teal-600">
                            {b.guest_name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {b.guest_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {b.room_type} · Room {b.room_number} · {b.nights} night{b.nights !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium text-gray-700">
                            {fmtDate(b.start_at)}
                          </p>
                          <span className={`inline-block text-[11px] font-semibold mt-0.5 px-2 py-0.5 rounded-full ${daysUntilColor(b.start_at)}`}>
                            {daysUntil(b.start_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Recent activity ───────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-5">
              <SectionHeader icon={IconHistory} title="Recent activity" />

              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((a: RecentActivity) => {
                    const { bg, text, icon: AIcon } = actionStyle(a.action);
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                          <AIcon size={14} className={text} />
                        </div>
                        <p className="flex-1 text-sm text-gray-700 truncate">
                          {actionLabel(a.action, a.entity_type)}
                          {a.entity_id
                            ? <span className="text-gray-400"> #{a.entity_id}</span>
                            : null}
                        </p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                          {fmtDate(a.created_at)} · {fmtTime(a.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}