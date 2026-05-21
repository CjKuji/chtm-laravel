import { useMemo, useState } from "react";

import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { useSidebar } from "@/app/context/SidebarContext";
import { useRoomManagement, type Room, type Task } from "@/app/hooks/useRoomManagement";
import { useHousekeepingService } from "@/app/hooks/useHouseKeeping";
import RequireRole from "@/app/components/RequireRole";

import HousekeepingModal from "@/app/components/modals/CheckListModal";
import TemplateModal from "@/app/components/modals/TemplateModal";
import RoomModal from "@/app/components/RoomModal";
import RoomHistoryModal from "@/app/components/modals/RoomHistoryModal";

/* =========================================================
  PHILIPPINES TIMEZONE HELPER
========================================================= */
function formatDateTimePH(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/* =========================================================
  STATUS CONFIG
========================================================= */
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  available:      { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500", label: "Available"      },
  occupied:       { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500",     label: "Occupied"       },
  cleaning:       { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500",   label: "Cleaning"       },
  inspected:      { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500",    label: "Inspected"      },
  needs_cleaning: { bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-500",  label: "Needs Cleaning" },
  dirty:          { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-400",     label: "Dirty"          },
  maintenance:    { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400",   label: "Maintenance"    },
  do_not_disturb: { bg: "bg-pink-50",     text: "text-pink-700",    dot: "bg-pink-500",    label: "Do Not Disturb" },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[status ?? ""] ?? { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: status ?? "Unknown" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* =========================================================
  FLAG HELPERS
========================================================= */
const isDND              = (room: Room) => room.status === "do_not_disturb";
const isMakeUpRoom       = (room: Room) => !!(room as any).make_up_room;
const isCheckoutRequest  = (room: Room) => !!(room as any).checkout_requested;

/* =========================================================
  TASK BUTTON
========================================================= */
function TaskActionButton({ task, startCleaning, openTask }: {
  task: Task;
  startCleaning: (id: number) => void;
  openTask: (id: number) => void;
}) {
  if (task.status === "pending") return (
    <button
      onClick={() => startCleaning(task.id)}
      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
    >
      Start Cleaning
    </button>
  );
  if (task.status === "in_progress") return (
    <button
      onClick={() => openTask(task.id)}
      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition"
    >
      Continue
    </button>
  );
  return (
    <button
      onClick={() => openTask(task.id)}
      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
    >
      View
    </button>
  );
}

/* =========================================================
  MAIN PAGE
========================================================= */
export default function RoomsInventory() {
  const { collapsed } = useSidebar();

  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [openRoomModal, setOpenRoomModal]         = useState(false);
  const [selectedRoom, setSelectedRoom]           = useState<Room | null>(null);
  const [historyRoom, setHistoryRoom]             = useState<Room | null>(null);
  const [tab, setTab]                             = useState<"inventory" | "housekeeping">("inventory");
  const [requestLoading, setRequestLoading]       = useState<number | null>(null);

  const {
    rooms, tasks, loading, selectedTask, setSelectedTask,
    deleteRoom, startCleaning, openTask, updateChecklistItem,
    completeCleaning, roomTypes, createRoom, updateRoom,
    updateRoomFlags, refreshRooms,
  } = useRoomManagement();

  const { requestMakeUpRoom, clearMakeUpRoom, setDoNotDisturb } = useHousekeepingService();

  /* ── Derived ── */
  const lastCleaningMap = useMemo(() => {
    const map: Record<number, any> = {};
    tasks?.filter((t) => t.status === "completed").forEach((t) => {
      if (t.room_id && !map[t.room_id]) map[t.room_id] = t;
    });
    return map;
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = { Deluxe: [], Standard: [], Other: [] };
    tasks.forEach((task) => {
      const name = task.rooms?.room_types?.name?.toLowerCase() ?? "";
      const group = name.includes("deluxe") ? "Deluxe" : name.includes("standard") ? "Standard" : "Other";
      groups[group].push(task);
    });
    return groups;
  }, [tasks]);

  /* ── Toggle flags ── */
  const toggleRoomRequest = async (room: Room, flag: string) => {
    setRequestLoading(room.id);
    try {
      if (flag === "do_not_disturb") {
        await setDoNotDisturb(room.id, !isDND(room));
      } else if (flag === "make_up_room") {
        if (!isMakeUpRoom(room)) {
          const roomTypeId = room.room_type_id ?? (room.room_type as any)?.id;
          if (!roomTypeId) return;
          await requestMakeUpRoom(room.id, roomTypeId);
        } else {
          await clearMakeUpRoom(room.id);
        }
      } else if (flag === "checkout_requested") {
        await updateRoomFlags(room.id, { checkout_requested: !isCheckoutRequest(room) });
      }
      await refreshRooms?.();
    } finally {
      setRequestLoading(null);
    }
  };

  const renderRequestBadges = (room: Room) => {
    const badges: { label: string; color: string }[] = [];
    if (isDND(room))             badges.push({ label: "Do Not Disturb", color: "bg-pink-50 text-pink-700 border-pink-200" });
    if (isMakeUpRoom(room))      badges.push({ label: "Make Up Room",   color: "bg-teal-50 text-teal-700 border-teal-200" });
    if (isCheckoutRequest(room)) badges.push({ label: "Checkout Requested", color: "bg-amber-50 text-amber-700 border-amber-200" });
    return badges;
  };

  const getFlagActive = (room: Room, flag: string) => {
    if (flag === "do_not_disturb")    return isDND(room);
    if (flag === "make_up_room")      return isMakeUpRoom(room);
    if (flag === "checkout_requested") return isCheckoutRequest(room);
    return false;
  };

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:     rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied:  rooms.filter((r) => r.status === "occupied").length,
    cleaning:  rooms.filter((r) => r.status === "cleaning" || r.status === "needs_cleaning").length,
  }), [rooms]);

  return (
    <RequireRole allowedRoles={["frontoffice", "housekeeper", "super_admin", "admin"]}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar activeMenu="room" />

        <main className={`flex-1 ${collapsed ? "ml-20" : "ml-64"} pt-16`}>
          <Topbar />

          <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

            {/* ── Page Header ── */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Room Management</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage rooms, housekeeping requests and status. All times in Philippine Standard Time (PHT).
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOpenTemplateModal(true)}
                  className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  🗒️ Manage Checklist
                </button>
                <button
                  onClick={() => { setSelectedRoom(null); setOpenRoomModal(true); }}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm"
                >
                  + Add Room
                </button>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Rooms",  value: stats.total,     color: "text-slate-700",   bg: "bg-white"         },
                { label: "Available",    value: stats.available, color: "text-emerald-700", bg: "bg-emerald-50"    },
                { label: "Occupied",     value: stats.occupied,  color: "text-red-700",     bg: "bg-red-50"        },
                { label: "Needs Cleaning", value: stats.cleaning, color: "text-amber-700",  bg: "bg-amber-50"      },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 shadow-sm p-4`}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              {(["inventory", "housekeeping"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTab(option)}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition ${
                    tab === option
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {option === "inventory" ? "🏨 Room Inventory" : "🧹 Housekeeping"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-slate-400">
                <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Loading rooms…
              </div>
            ) : (
              <>
                {/* ══════════════════════════════
                    INVENTORY TAB
                ══════════════════════════════ */}
                {tab === "inventory" ? (
                  <section>
                    {rooms.length === 0 ? (
                      <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400">
                        <div className="text-5xl mb-3">🏨</div>
                        <p className="text-lg font-semibold">No rooms yet</p>
                        <p className="text-sm mt-1">Click "Add Room" to get started.</p>
                      </div>
                    ) : (
                      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {rooms.map((room) => {
                          const lastClean   = lastCleaningMap[room.id];
                          const roomTypeName = room.room_type?.name || "No Room Type";
                          const badges      = renderRequestBadges(room);
                          const isDirty     = room.status === "needs_cleaning" || room.status === "dirty";

                          return (
                            <div
                              key={room.id}
                              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden ${
                                isDirty ? "border-orange-300 ring-1 ring-orange-200" : "border-slate-100"
                              }`}
                            >
                              {/* Card top */}
                              <div className="p-5 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                      Room {room.room_number ?? "—"}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{roomTypeName}</p>
                                    {(room.room_type as any)?.description && (
                                      <p className="text-[11px] text-indigo-500 mt-1 italic">
                                        {(room.room_type as any).description}
                                      </p>
                                    )}
                                  </div>
                                  <StatusBadge status={room.status} />
                                </div>

                                {/* Last cleaned */}
                                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                                  <p className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] mb-1.5">
                                    🧹 Last Cleaned
                                  </p>
                                  {lastClean ? (
                                    <>
                                      <p className="font-medium">{formatDateTimePH(lastClean.completed_at)}</p>
                                      <p className="text-slate-500 mt-0.5">
                                        by{" "}
                                        {lastClean.completed_user
                                          ? `${lastClean.completed_user.fname ?? ""} ${lastClean.completed_user.lname ?? ""}`.trim()
                                          : "Unknown"}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-slate-400">No record yet</p>
                                  )}
                                </div>

                                {/* Badges */}
                                {badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {badges.map((b) => (
                                      <span key={b.label} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${b.color}`}>
                                        {b.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Card footer */}
                              <div className="px-5 py-3 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => { setSelectedRoom(room); setOpenRoomModal(true); }}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteRoom(room.id)}
                                    className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                                <button
                                  onClick={() => setHistoryRoom(room)}
                                  className="text-xs font-medium text-purple-600 hover:text-purple-800 transition"
                                >
                                  View History →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                ) : (
                  /* ══════════════════════════════
                      HOUSEKEEPING TAB
                  ══════════════════════════════ */
                  <div className="space-y-8">

                    {/* Housekeeping Requests */}
                    <section>
                      <h2 className="text-base font-bold text-slate-700 mb-4">Guest Requests</h2>

                      {rooms.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400">
                          No rooms available
                        </div>
                      ) : (
                        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
                          {rooms.map((room) => {
                            const badges      = renderRequestBadges(room);
                            const isThisLoading = requestLoading === room.id;

                            return (
                              <div
                                key={room.id}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                              >
                                <div className="p-5 space-y-4">
                                  {/* Room info */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <h3 className="text-lg font-bold text-slate-800">
                                        Room {room.room_number ?? "—"}
                                      </h3>
                                      <p className="text-xs text-slate-400">{room.room_type?.name ?? "No Room Type"}</p>
                                    </div>
                                    <StatusBadge status={room.status} />
                                  </div>

                                  {/* Active badges */}
                                  <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                                    {badges.length > 0 ? (
                                      badges.map((b) => (
                                        <span key={b.label} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${b.color}`}>
                                          {b.label}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-400">
                                        No active requests
                                      </span>
                                    )}
                                  </div>

                                  {/* Toggle buttons */}
                                  <div className="space-y-2">
                                    {[
                                      { key: "do_not_disturb",    label: "Do Not Disturb",    icon: "🚫" },
                                      { key: "make_up_room",      label: "Make Up Room",       icon: "🛏️" },
                                      { key: "checkout_requested", label: "Checkout Requested", icon: "🏃" },
                                    ].map((opt) => {
                                      const active = getFlagActive(room, opt.key);
                                      return (
                                        <button
                                          key={opt.key}
                                          type="button"
                                          onClick={() => toggleRoomRequest(room, opt.key)}
                                          disabled={isThisLoading}
                                          className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                            active
                                              ? "bg-teal-600 text-white hover:bg-teal-700"
                                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                          <span>{opt.icon}</span>
                                          {isThisLoading ? "Updating…" : active ? `Clear ${opt.label}` : `Set ${opt.label}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {/* Tasks by Room Type */}
                    <section>
                      <h2 className="text-base font-bold text-slate-700 mb-4">Tasks by Room Type</h2>

                      <div className="space-y-4">
                        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                          <div key={groupName} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="font-semibold text-slate-700">{groupName}</h3>
                              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                                {groupTasks.length} task{groupTasks.length !== 1 ? "s" : ""}
                              </span>
                            </div>

                            {groupTasks.length === 0 ? (
                              <div className="px-5 py-6 text-sm text-slate-400 text-center">
                                No tasks in this category
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-50">
                                {groupTasks.map((task) => (
                                  <div key={task.id} className="px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-slate-800">
                                        {task.rooms?.room_number ? `Room ${task.rooms.room_number}` : "Room request"}
                                      </div>
                                      <div className="text-xs text-slate-400 mt-0.5">
                                        {task.rooms?.room_types?.name ?? "Unknown type"}
                                      </div>
                                      {task.note && (
                                        <div className="text-xs text-slate-500 mt-1 italic">
                                          {task.note}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <StatusBadge status={task.status ?? "pending"} />
                                      <TaskActionButton task={task} startCleaning={startCleaning} openTask={openTask} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── Modals ── */}
        <HousekeepingModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onCheck={updateChecklistItem}
          onComplete={completeCleaning}
        />

        <TemplateModal open={openTemplateModal} onClose={() => setOpenTemplateModal(false)} />

        <RoomModal
          open={openRoomModal}
          room={selectedRoom}
          roomTypes={roomTypes}
          onClose={() => setOpenRoomModal(false)}
          onSaved={(savedRoom: any) => {
            setOpenRoomModal(false);
            setSelectedRoom(null);
            const { id, ...payload } = savedRoom;
            if (selectedRoom) updateRoom(selectedRoom.id, payload);
            else createRoom(payload);
          }}
        />

        <RoomHistoryModal
          room={historyRoom}
          open={!!historyRoom}
          onClose={() => setHistoryRoom(null)}
        />
      </div>
    </RequireRole>
  );
}