import { useEffect, useState } from "react";

type RoomModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (room: any) => void;
  room?: any;
  roomTypes: any[];
};

const STATUS_OPTIONS = [
  { value: "available",      label: "Available",       color: "text-emerald-600" },
  { value: "occupied",       label: "Occupied",        color: "text-red-600"     },
  { value: "needs_cleaning", label: "Needs Cleaning",  color: "text-orange-600"  },
  { value: "cleaning",       label: "Cleaning",        color: "text-yellow-600"  },
  { value: "inspected",      label: "Inspected",       color: "text-blue-600"    },
  { value: "maintenance",    label: "Maintenance",     color: "text-gray-600"    },
];

export default function RoomModal({ open, onClose, onSaved, room, roomTypes }: RoomModalProps) {
  const isEdit = !!room;

  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor]           = useState(1);
  const [roomTypeId, setRoomTypeId] = useState<number | null>(null);
  const [status, setStatus]         = useState("available");
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<{ roomNumber?: string; roomType?: string }>({});

  useEffect(() => {
    if (!open) return;

    if (room) {
      setRoomNumber(room.room_number ?? "");
      setFloor(room.floor ?? 1);
      setRoomTypeId(room.room_type_id ?? room.room_types?.id ?? null);
      setStatus(room.status ?? "available");
    } else {
      setRoomNumber("");
      setFloor(1);
      setRoomTypeId(roomTypes?.[0]?.id ?? null);
      setStatus("available");
    }
    setErrors({});
  }, [room, roomTypes, open]);

  if (!open) return null;

  const validate = () => {
    const e: typeof errors = {};
    if (!roomNumber.trim()) e.roomNumber = "Room number is required";
    if (!roomTypeId) e.roomType = "Please select a room type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSaved({ room_number: roomNumber, floor, room_type_id: roomTypeId, status });
      onClose();
    } catch (err) {
      console.error("[RoomModal]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? "Edit Room" : "Add New Room"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? `Editing Room ${room.room_number}` : "Fill in room details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Room Number + Floor (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                value={roomNumber}
                onChange={(e) => { setRoomNumber(e.target.value); setErrors((p) => ({ ...p, roomNumber: undefined })); }}
                placeholder="e.g. 101"
                className={`mt-1.5 w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${
                  errors.roomNumber ? "border-red-400 bg-red-50" : "border-slate-200"
                }`}
              />
              {errors.roomNumber && <p className="text-xs text-red-500 mt-1">{errors.roomNumber}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Floor</label>
              <input
                type="number"
                min={1}
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Room Type <span className="text-red-500">*</span>
            </label>
            <select
              value={roomTypeId ?? ""}
              onChange={(e) => { setRoomTypeId(Number(e.target.value)); setErrors((p) => ({ ...p, roomType: undefined })); }}
              className={`mt-1.5 w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${
                errors.roomType ? "border-red-400 bg-red-50" : "border-slate-200"
              }`}
            >
              <option value="" disabled>Select a room type…</option>
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.capacity ? `(Max: ${type.capacity})` : ""}
                </option>
              ))}
            </select>
            {errors.roomType && <p className="text-xs text-red-500 mt-1">{errors.roomType}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                    status === opt.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    status === opt.value ? "bg-indigo-500" : "bg-slate-300"
                  }`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-slate-200 bg-white rounded-xl hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
          >
            {loading ? "Saving…" : isEdit ? "Update Room" : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}