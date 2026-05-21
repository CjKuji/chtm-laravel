import { useEffect, useState, useMemo } from "react";

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
  TYPES
========================================================= */
interface TaskItem {
  id: number;
  item_name: string;
  quantity?: number;
  is_done: boolean;
  note?: string | null;
}

interface Task {
  id: number;
  note?: string | null;
  started_at?: string;
  housekeeping_task_items?: TaskItem[];
}

interface Props {
  task: Task | null;
  onClose: () => void;
  onCheck: (itemId: number, isDone: boolean, note?: string) => void;
  onComplete: (taskId: number, note?: string) => void;
}

/* =========================================================
  COMPONENT
========================================================= */
export default function HousekeepingModal({ task, onClose, onCheck, onComplete }: Props) {
  const [notes, setNotes]             = useState<Record<number, string>>({});
  const [overallNote, setOverallNote] = useState("");
  const [expandedId, setExpandedId]   = useState<number | null>(null);

  /* Reset when task changes */
  useEffect(() => {
    if (!task) return;
    setOverallNote(task.note ?? "");
    const initialNotes: Record<number, string> = {};
    (task.housekeeping_task_items ?? []).forEach((i) => {
      initialNotes[i.id] = i.note ?? "";
    });
    setNotes(initialNotes);
    setExpandedId(null);
  }, [task?.id]);

  const items   = useMemo(() => task?.housekeeping_task_items ?? [], [task]);
  const done    = useMemo(() => items.filter((i) => i.is_done).length, [items]);
  const total   = items.length;
  const progress = total ? (done / total) * 100 : 0;
  const allDone  = total > 0 && done === total;

  /* ── Handlers ── */
  const handleCheck = (item: TaskItem, checked: boolean) => {
    const note = notes[item.id] ?? item.note ?? "";
    onCheck(item.id, checked, note);
  };

  const handleNoteChange = (itemId: number, value: string) => {
    setNotes((prev) => ({ ...prev, [itemId]: value }));
  };

  /* Select all / clear all */
  const handleSelectAll = (check: boolean) => {
    items.forEach((item) => {
      if (item.is_done !== check) {
        const note = notes[item.id] ?? item.note ?? "";
        onCheck(item.id, check, note);
      }
    });
  };

  if (!task) return null;

  /* ── Progress color ── */
  const progressColor =
    progress === 100 ? "bg-emerald-500" :
    progress >= 50   ? "bg-amber-400"   :
                       "bg-blue-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cleaning Checklist</h2>
              {task.started_at && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Started {formatDateTimePH(task.started_at)} · PHT
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{done} of {total} tasks completed</span>
              <span className="font-semibold text-slate-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Select all / clear all */}
          {total > 0 && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleSelectAll(true)}
                disabled={allDone}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ✓ Select All
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                disabled={done === 0}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ✗ Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-medium">No checklist items</p>
              <p className="text-xs mt-1">Add items to the template first.</p>
            </div>
          )}

          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={`task-item-${item.id}`}
                className={`rounded-xl border transition-all ${
                  item.is_done
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => handleCheck(item, !item.is_done)}
                    className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition ${
                      item.is_done
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 hover:border-emerald-400"
                    }`}
                  >
                    {item.is_done && (
                      <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white">
                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.is_done ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {item.item_name}
                    </p>
                    {item.quantity != null && (
                      <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition px-1.5 py-0.5 rounded"
                  >
                    {isExpanded ? "▲" : "📝"}
                  </button>
                </div>

                {/* Expandable note */}
                {isExpanded && (
                  <div className="px-4 pb-3">
                    <textarea
                      value={notes[item.id] ?? ""}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      placeholder="Add a note for this item…"
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Overall note */}
          {total > 0 && (
            <div className="border-t border-slate-100 pt-4 mt-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Overall Note
              </label>
              <textarea
                value={overallNote}
                onChange={(e) => setOverallNote(e.target.value)}
                placeholder="Optional summary or additional notes…"
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 mt-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-slate-200 bg-white rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>

          <button
            onClick={() => onComplete(task.id, overallNote)}
            disabled={total === 0 || done !== total}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition ${
              done === total && total > 0
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {done === total && total > 0 ? "✓ Complete Cleaning" : `Complete (${done}/${total})`}
          </button>
        </div>
      </div>
    </div>
  );
}