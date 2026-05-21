import { useCallback, useState } from "react";
import { HousekeepingService } from "@/app/services/housekeeping.service";

export function useHousekeepingService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await fn();
      return result;
    } catch (err: any) {
      const message = err?.message || "Something went wrong";
      setError(message);
      console.error("[HousekeepingService Error]", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
    MAKE UP ROOM — sets room to "cleaning" + creates task
  ========================================================= */
  const requestMakeUpRoom = useCallback(
    async (roomId: number, roomTypeId: number) => {
      return wrap(() =>
        HousekeepingService.requestMakeUpRoom(roomId, roomTypeId)
      );
    },
    [wrap]
  );

  /* =========================================================
    CLEAR MAKE UP ROOM — removes flag, restores "available"
  ========================================================= */
  const clearMakeUpRoom = useCallback(
    async (roomId: number) => {
      return wrap(() =>
        HousekeepingService.clearMakeUpRoom(roomId)
      );
    },
    [wrap]
  );

  /* =========================================================
    DO NOT DISTURB
    Calls HousekeepingService.setDoNotDisturb which only updates
    rooms.status — no non-existent boolean column is touched.
  ========================================================= */
  const setDoNotDisturb = useCallback(
    async (roomId: number, enabled: boolean) => {
      return wrap(() =>
        HousekeepingService.setDoNotDisturb(roomId, enabled)
      );
    },
    [wrap]
  );

  /* =========================================================
    GET TEMPLATE (optional exposure for UI previews)
  ========================================================= */
  const getTemplate = useCallback(
    async (roomTypeId: number) => {
      return wrap(() =>
        HousekeepingService.getTemplate(roomTypeId)
      );
    },
    [wrap]
  );

  return {
    loading,
    error,

    requestMakeUpRoom,
    clearMakeUpRoom,
    setDoNotDisturb,
    getTemplate,
  };
}