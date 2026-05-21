import { useEffect, useState, useCallback, useRef } from "react";
import { RoomService } from "@/app/services/room.service";

/* =========================================================
  TYPES
========================================================= */

export interface TaskItem {
  id: number;
  item_name: string;
  quantity?: number;
  is_done: boolean;
  note?: string | null;
}

export interface Task {
  id: number;
  room_id?: number;
  status?: string;
  note?: string | null;
  started_at?: string;
  completed_at?: string;
  completed_user?: any;
  housekeeping_task_items?: TaskItem[];

  rooms?: {
    id: number;
    room_number: string;
    room_types?: {
      id: number;
      name: string;
      description?: string | null;
    } | null;
  };
}

export interface Room {
  id: number;
  room_number?: string;
  // status is the single source of truth for DND — it is set to
  // "do_not_disturb" by the service; there is NO separate boolean column.
  status?: string;
  room_type_id?: number;
  room_type?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
  // These boolean flag columns DO exist in the rooms table:
  make_up_room?: boolean;
  checkout_requested?: boolean;
  // do_not_disturb is intentionally NOT listed here as a boolean —
  // the DB enum uses room.status === "do_not_disturb" instead.
}

type AnyObj = Record<string, any>;

/* =========================================================
  DATE SAFETY HELPERS
========================================================= */

const toSafeDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
};

const formatDateTime = (value?: string | null) => {
  const date = toSafeDate(value);
  if (!date) return "N/A";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* =========================================================
  HOOK
========================================================= */

export function useRoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [roomTypes, setRoomTypes] = useState<AnyObj[]>([]);
  const [amenities, setAmenities] = useState<AnyObj[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* =========================================================
    NORMALIZER
    Merges room_type relation onto each room while preserving
    ALL columns returned by Supabase (make_up_room,
    checkout_requested, status, etc.).
  ========================================================= */
  const normalizeRooms = useCallback(
    (roomsData: any[], typesData: AnyObj[]): Room[] => {
      return (roomsData ?? []).map((room) => {
        // If Supabase already joined room_types, keep it as-is.
        if (room.room_type) return room as Room;

        const foundType = typesData.find((t) => t.id === room.room_type_id);
        return {
          ...room,               // ← preserves status, make_up_room, checkout_requested, etc.
          room_type: foundType ?? null,
        } as Room;
      });
    },
    []
  );

  /* =========================================================
    FULL SYNC
  ========================================================= */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [roomsData, typesData, amenitiesData, tasksData] =
        await Promise.all([
          RoomService.getRooms(),
          RoomService.getRoomTypes(),
          RoomService.getAmenities(),
          RoomService.getHousekeepingTasks(),
        ]);

      if (!isMounted.current) return;

      setRooms(normalizeRooms(roomsData ?? [], typesData ?? []));
      setRoomTypes(typesData ?? []);
      setAmenities(amenitiesData ?? []);
      setTasks((tasksData ?? []) as Task[]);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to load data");
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
    }
  }, [normalizeRooms]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* =========================================================
    REFRESH ROOMS ONLY
    Called after every flag/status toggle so cards re-render
    with the latest status from the DB.
  ========================================================= */
  const refreshRooms = useCallback(async () => {
    setRefreshing(true);
    try {
      const [roomsData, typesData] = await Promise.all([
        RoomService.getRooms(),
        RoomService.getRoomTypes(),
      ]);
      if (!isMounted.current) return;
      setRooms(normalizeRooms(roomsData ?? [], typesData ?? []));
      setRoomTypes(typesData ?? []);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to refresh rooms");
    } finally {
      if (!isMounted.current) return;
      setRefreshing(false);
    }
  }, [normalizeRooms]);

  /* =========================================================
    REFRESH TASKS ONLY
  ========================================================= */
  const refreshTasks = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasksData = await RoomService.getHousekeepingTasks();
      if (!isMounted.current) return;
      setTasks((tasksData ?? []) as Task[]);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to refresh tasks");
    } finally {
      if (!isMounted.current) return;
      setRefreshing(false);
    }
  }, []);

  /* =========================================================
    ACTION WRAPPER
  ========================================================= */
  const runAction = useCallback(async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Action failed");
    } finally {
      if (!isMounted.current) return;
      setActionLoading(false);
    }
  }, []);

  /* =========================================================
    ROOM ACTIONS
  ========================================================= */

  const createRoom = useCallback(
    (data: AnyObj) =>
      runAction(async () => {
        const newRoom = await RoomService.createRoom(data);
        if (!isMounted.current) return;
        const type = roomTypes.find((t) => t.id === newRoom.room_type_id);
        setRooms((prev) => [
          { ...newRoom, room_type: type ?? null } as Room,
          ...prev,
        ]);
      }),
    [runAction, roomTypes]
  );

  const updateRoom = useCallback(
    (id: number, data: AnyObj) =>
      runAction(async () => {
        const updated = await RoomService.updateRoom(id, data);
        if (!isMounted.current) return;
        const type = roomTypes.find((t) => t.id === updated.room_type_id);
        setRooms((prev) =>
          prev.map((room) =>
            room.id === id
              ? ({ ...room, ...updated, room_type: type ?? null } as Room)
              : room
          )
        );
      }),
    [runAction, roomTypes]
  );

  const updateRoomFlags = useCallback(
    (id: number, payload: AnyObj) =>
      runAction(async () => {
        const updated = await RoomService.updateRoomFlags(id, payload);
        if (!isMounted.current) return;
        const type = roomTypes.find((t) => t.id === updated.room_type_id);
        setRooms((prev) =>
          prev.map((room) =>
            room.id === id
              ? ({ ...room, ...updated, room_type: type ?? null } as Room)
              : room
          )
        );
      }),
    [runAction, roomTypes]
  );

  const deleteRoom = useCallback(
    (id: number) =>
      runAction(async () => {
        await RoomService.deleteRoom(id);
        if (!isMounted.current) return;
        setRooms((prev) => prev.filter((room) => room.id !== id));
      }),
    [runAction]
  );

  /* =========================================================
    HOUSEKEEPING
  ========================================================= */

  const startCleaning = useCallback(
    (taskId: number) =>
      runAction(async () => {
        const updatedTask = await RoomService.startCleaning(taskId);
        if (!isMounted.current) return;

        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? ({
                  ...task,
                  ...updatedTask,
                  status: "in_progress",
                  started_at: updatedTask.started_at ?? new Date().toISOString(),
                } as Task)
              : task
          )
        );

        const updatedRooms = await RoomService.getRooms();
        if (!isMounted.current) return;
        setRooms(normalizeRooms(updatedRooms, roomTypes));
      }),
    [runAction, roomTypes, normalizeRooms]
  );

  const openTask = useCallback(async (taskId: number) => {
    try {
      const task = await RoomService.getTaskById(taskId);
      if (!isMounted.current) return;
      setSelectedTask(task as Task);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to load task");
    }
  }, []);

  const updateChecklistItem = useCallback(
    (itemId: number, isDone: boolean, note?: string) =>
      runAction(async () => {
        await RoomService.updateChecklistItem(itemId, isDone, note);
        if (!isMounted.current) return;
        setSelectedTask((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            housekeeping_task_items:
              prev.housekeeping_task_items?.map((item) =>
                item.id === itemId
                  ? { ...item, is_done: isDone, note: note ?? item.note }
                  : item
              ) ?? [],
          };
        });
      }),
    [runAction]
  );

  const completeCleaning = useCallback(
    (taskId: number, note?: string) =>
      runAction(async () => {
        await RoomService.completeCleaning(taskId, note);
        if (!isMounted.current) return;
        setSelectedTask(null);
        await fetchAll();
      }),
    [runAction, fetchAll]
  );

  return {
    rooms,
    tasks,
    selectedTask,
    setSelectedTask,
    roomTypes,
    amenities,

    loading,
    refreshing,
    actionLoading,
    error,

    refresh: refreshTasks,
    refreshRooms,

    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomFlags,

    startCleaning,
    openTask,
    updateChecklistItem,
    completeCleaning,

    formatDateTime,
  };
}