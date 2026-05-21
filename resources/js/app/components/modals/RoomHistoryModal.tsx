import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/* -------------------------
   PHILIPPINES TIMEZONE HELPER
--------------------------*/
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

/* -------------------------
   SAFE TYPES
--------------------------*/
type RoomType = { id: number; name: string };
type Room = {
  id: number;
  room_number: string;
  room_type_id: number;
  room_types?: RoomType[];
};
type Task = {
  id: number;
  status: string;
  note: string | null;
  started_at: string;
  completed_at: string;
  created_at: string;
  assigned_to: string;
  completed_by: string;
  room_id: number;
  rooms?: Room[];
};

interface Props {
  open: boolean;
  room: any;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  completed:   { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  in_progress: { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  pending:     { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
};

export default function RoomHistoryModal({ open, room, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [cleaningHistory, setCleaningHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !room?.id) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data: tasks, error } = await supabase
          .from("housekeeping_tasks")
          .select(`
            id, status, note, started_at, completed_at, created_at,
            assigned_to, completed_by, room_id,
            rooms ( id, room_number, room_type_id, room_types ( id, name ) )
          `)
          .eq("room_id", room.id)
          .order("completed_at", { ascending: false });

        if (error) throw error;

        const userIds = Array.from(
          new Set(
            (tasks ?? []).flatMap((t) => [t.assigned_to, t.completed_by]).filter(Boolean)
          )
        );

        const userMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("users")
            .select("id, fname, lname, email")
            .in("id", userIds);
          users?.forEach((u) => {
            userMap[u.id] = `${u.fname ?? ""} ${u.lname ?? ""}`.trim() || u.email || "Staff";
          });
        }

        const enrichedTasks = (tasks ?? []).map((t: any) => {
          const r = Array.isArray(t.rooms) ? t.rooms[0] : t.rooms;
          const roomType = Array.isArray(r?.room_types) ? r?.room_types[0] : r?.room_types;
          return {
            ...t,
            assigned_name: userMap[t.assigned_to] || "Staff",
            completed_by_name: userMap[t.completed_by] || "Staff",
            room_type_name: roomType?.name ?? "Unknown Type",
          };
        });

        setCleaningHistory(enrichedTasks);
      } catch (err) {
        console.error("[RoomHistoryModal]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, room?.id]);

  if (!open) return null;

  const roomLabel = room?.room_number ? `Room ${room.room_number}` : "Room";
  const roomType  = room?.room_type?.name || room?.room_types?.[0]?.name || "Unknown Type";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{roomLabel}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {roomType} · Cleaning History
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading history…
            </div>
          ) : cleaningHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🧹</div>
              <p className="font-medium">No cleaning history found</p>
              <p className="text-xs mt-1">Records will appear after tasks are completed.</p>
            </div>
          ) : (
            cleaningHistory.map((task, idx) => {
              const s = STATUS_STYLES[task.status] ?? STATUS_STYLES.pending;
              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition p-4 space-y-3"
                >
                  {/* Row 1 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                      <span className="text-sm font-semibold text-slate-700">Task #{task.id}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {task.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Row 2 – timestamps */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Started</p>
                      <p className="font-medium">{formatDateTimePH(task.started_at)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-0.5">Completed</p>
                      <p className="font-medium text-emerald-700">{formatDateTimePH(task.completed_at)}</p>
                    </div>
                  </div>

                  {/* Row 3 – staff */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1 text-slate-600">
                      <span>👷</span> Assigned: <strong>{task.assigned_name}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1 text-slate-600">
                      <span>✅</span> By: <strong>{task.completed_by_name}</strong>
                    </span>
                  </div>

                  {/* Note */}
                  {task.note && (
                    <p className="text-xs text-slate-500 italic bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      📝 {task.note}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-400">
            {cleaningHistory.length} record{cleaningHistory.length !== 1 ? "s" : ""} · Times in Philippine Standard Time (PHT)
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}