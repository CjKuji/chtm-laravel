import { supabase } from "@/lib/supabase";

export const HousekeepingService = {
  /* =========================================================
    GET TEMPLATE BY ROOM TYPE
  ========================================================= */
  async getTemplate(roomTypeId: number) {
    const { data, error } = await supabase
      .from("housekeeping_templates")
      .select(`*, housekeeping_template_items (*)`)
      .eq("room_type_id", roomTypeId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return data;
  },

  /* =========================================================
    CREATE TASK FROM TEMPLATE
  ========================================================= */
  async createTaskFromTemplate(roomId: number, roomTypeId: number) {
    const template = await this.getTemplate(roomTypeId);

    if (!template) {
      throw new Error("No housekeeping template found for this room type");
    }

    // 1. create task
    const { data: task, error } = await supabase
      .from("housekeeping_tasks")
      .insert({
        room_id: roomId,
        status: "pending",
        template_id: template.id,
        note: "Auto-generated from Make Up Room request",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 2. create task items from template
    if (template.housekeeping_template_items?.length) {
      const items = template.housekeeping_template_items.map((item: any) => ({
        task_id: task.id,
        item_name: item.item_name,
        quantity: item.default_quantity ?? 1,
        is_done: false,
      }));

      const { error: itemError } = await supabase
        .from("housekeeping_task_items")
        .insert(items);

      if (itemError) throw new Error(itemError.message);
    }

    return task;
  },

  /* =========================================================
    MAKE UP ROOM FLOW
    - Prevents duplicate pending tasks
    - Sets room status to "cleaning" and make_up_room flag to true
  ========================================================= */
  async requestMakeUpRoom(roomId: number, roomTypeId: number) {
    // prevent duplicate pending tasks for the same room
    const { data: existing } = await supabase
      .from("housekeeping_tasks")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) return existing;

    // create task from template
    const task = await this.createTaskFromTemplate(roomId, roomTypeId);

    // update room: status → cleaning, flag make_up_room = true
    const { error: roomError } = await supabase
      .from("rooms")
      .update({ status: "cleaning", make_up_room: true })
      .eq("id", roomId);

    if (roomError) throw new Error(roomError.message);

    return task;
  },

  /* =========================================================
    CLEAR MAKE UP ROOM FLOW
    - Removes make_up_room flag
    - Restores room status to "available"
  ========================================================= */
  async clearMakeUpRoom(roomId: number) {
    const { data, error } = await supabase
      .from("rooms")
      .update({ make_up_room: false, status: "available" })
      .eq("id", roomId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  },

  /* =========================================================
    DO NOT DISTURB FLOW

    "do_not_disturb" is a value of the room_status enum —
    it lives in rooms.status, NOT in a separate boolean column.

    Enabling  → status = "do_not_disturb"
    Disabling → status = "available"

    DO NOT add any other columns here; writing a non-existent
    column causes Supabase to throw, which was silently swallowed
    by the wrap() error handler and made the toggle appear broken.
  ========================================================= */
  async setDoNotDisturb(roomId: number, enabled: boolean) {
    const status = enabled ? "do_not_disturb" : "available";

    const { data, error } = await supabase
      .from("rooms")
      .update({ status })   // ← only update the status column
      .eq("id", roomId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  },
};