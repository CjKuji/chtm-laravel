import { supabase } from "@/lib/supabase";
import { BookingStatus } from "@/types/enums.types";
import { BookingWithMeta } from "@/types/booking.types";

/* ── Room status enum (mirrors DB) ─────────────────────────────────── */
type RoomStatus =
  | "available"
  | "occupied"
  | "needs_cleaning"
  | "cleaning"
  | "inspected"
  | "maintenance"
  | "do_not_disturb";

/* =========================================================
  BOOKING SERVICE
========================================================= */
export class BookingService {

  /* ── Debug ─────────────────────────────────────────────────────────── */
  private static debug(label: string, data?: any) {
    console.log(`[BookingService:${label}]`, data ?? "");
  }

  /* ── Pricing constants ─────────────────────────────────────────────── */
  private static EXTRA_BED_PRICE: Record<number, number> = {
    0: 0,
    1: 700,
    2: 1400,
  };

  static getExtraBedFee(extraBeds: number): number {
    return this.EXTRA_BED_PRICE[extraBeds] ?? 0;
  }

  static getExtraBedLabel(extraBeds: number): string {
    if (extraBeds === 1) return "1 Extra Bed";
    if (extraBeds === 2) return "2 Extra Beds";
    return "No Extra Bed";
  }

  private static roundToTwo(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private static getBookingNights(
    startAt?: string | null,
    endAt?: string | null
  ): number {
    if (!startAt || !endAt) return 1;
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 1;
  }

  static computeBookingTotals(params: {
    price_at_booking?: number | null;
    guests?: number | null;
    extra_beds?: number | null;
    has_pwd?: boolean | null;
    has_senior?: boolean | null;
    start_at?: string | null;
    end_at?: string | null;
  }) {
    const price = Number(params.price_at_booking ?? 0);
    const guests = Math.max(1, Number(params.guests ?? 1));
    const extraBeds = Number(params.extra_beds ?? 0);
    const nights = this.getBookingNights(params.start_at, params.end_at);

    const roomTotal = price * nights;
    const extraBedTotal = this.getExtraBedFee(extraBeds) * nights;

    const eligibleCount =
      Number(Boolean(params.has_pwd)) + Number(Boolean(params.has_senior));
    const eligiblePeople = Math.min(eligibleCount, guests);
    const discountPerPerson = (price / guests) * 0.2 * nights;
    const discountAmount = this.roundToTwo(discountPerPerson * eligiblePeople);

    const totalAmount = this.roundToTwo(
      Math.max(0, roomTotal + extraBedTotal - discountAmount)
    );

    return { nights, roomTotal, extraBedTotal, discountAmount, totalAmount };
  }

  /* ── Amenities ─────────────────────────────────────────────────────── */
  private static formatAmenities(roomType: any): string[] {
    return (
      roomType?.room_amenities
        ?.map((ra: any) => ra?.amenities?.name)
        .filter(Boolean) ?? []
    );
  }

  /* ── Room status updater ───────────────────────────────────────────── */
  private static async setRoomStatus(
    roomId: number,
    status: RoomStatus
  ): Promise<void> {
    const { error } = await supabase
      .from("rooms")
      .update({ status })
      .eq("id", roomId);

    if (error) {
      this.debug("setRoomStatus:error", error);
      throw error;
    }
  }

  /* ── SELECT fragment (reused everywhere) ───────────────────────────── */
  private static readonly BOOKING_SELECT = `
    id,
    user_id,
    room_id,
    start_at,
    end_at,
    guests,
    extra_beds,
    price_at_booking,
    total_amount,
    message,
    status,
    payment_method,
    created_at,
    checked_in_at,
    checked_out_at,
    has_child,
    child_age_group,
    has_pwd,
    has_senior,
    approved_by,
    rejected_by,
    checked_in_by,
    checked_out_by,

    users!fk_bookings_user (
      id,
      fname,
      lname,
      email
    ),

    rooms (
      id,
      room_number,
      floor,
      status,
      room_type_id,

      room_types (
        id,
        name,
        description,
        capacity,
        base_price,
        room_amenities (
          amenities (id, name)
        )
      )
    )
  `;

  /* ── Mapper ────────────────────────────────────────────────────────── */
  private static mapBooking(b: any): BookingWithMeta {
    const room = b?.rooms ?? null;
    const roomType = room?.room_types ?? null;

    const computedTotals = this.computeBookingTotals({
      price_at_booking: b?.price_at_booking,
      guests: b?.guests,
      extra_beds: b?.extra_beds,
      has_pwd: b?.has_pwd,
      has_senior: b?.has_senior,
      start_at: b?.start_at,
      end_at: b?.end_at,
    });

    return {
      ...b,
      total_amount: computedTotals.totalAmount,

      room: room
        ? {
            id: room.id,
            room_number: room.room_number,
            floor: room.floor,
            status: room.status,
            room_type: roomType,
          }
        : null,

      users: b?.users ?? null,
      room_type_name: roomType?.name ?? "Unknown Type",
      amenities: this.formatAmenities(roomType),
      extra_bed_fee: this.getExtraBedFee(b?.extra_beds ?? 0),
      extra_bed_label: this.getExtraBedLabel(b?.extra_beds ?? 0),
    };
  }

  /* =========================================================
    GET ALL
  ========================================================= */
  static async getAll(): Promise<BookingWithMeta[]> {
    this.debug("getAll:start");

    const { data, error } = await supabase
      .from("bookings")
      .select(this.BOOKING_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      this.debug("getAll:error", error);
      throw error;
    }

    return (data ?? []).map((b) => this.mapBooking(b));
  }

  /* =========================================================
    GET BY ID
  ========================================================= */
  static async getById(id: number): Promise<BookingWithMeta> {
    this.debug("getById", id);

    const { data, error } = await supabase
      .from("bookings")
      .select(this.BOOKING_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      this.debug("getById:error", error);
      throw error;
    }

    return this.mapBooking(data);
  }

  /* =========================================================
    UPDATE BOOKING DETAILS
  ========================================================= */
  static async updateBookingDetails(
    id: number,
    payload: {
      start_at?: string | null;
      end_at?: string | null;
      room_id?: number | null;
      guests?: number | null;
      extra_beds?: number | null;
      has_child?: boolean | null;
      child_age_group?: string | null;
      has_pwd?: boolean | null;
      has_senior?: boolean | null;
      guest_fname?: string | null;
      guest_lname?: string | null;
      guest_email?: string | null;
    }
  ): Promise<BookingWithMeta> {
    /* 1. look up existing booking for totals recalculation */
    const { data: existing, error: lookupErr } = await supabase
      .from("bookings")
      .select("user_id, price_at_booking, guests, extra_beds, has_pwd, has_senior, start_at, end_at")
      .eq("id", id)
      .single();

    if (lookupErr) throw lookupErr;

    /* 2. patch user profile fields if supplied */
    const userFields: any = {};
    if (payload.guest_fname !== undefined) userFields.fname = payload.guest_fname;
    if (payload.guest_lname !== undefined) userFields.lname = payload.guest_lname;
    if (payload.guest_email !== undefined) userFields.email = payload.guest_email;

    if (Object.keys(userFields).length > 0 && existing?.user_id) {
      const { error: userErr } = await supabase
        .from("users")
        .update(userFields)
        .eq("id", existing.user_id);
      if (userErr) throw userErr;
    }

    /* 3. recalculate total */
    const totals = this.computeBookingTotals({
      price_at_booking: existing?.price_at_booking ?? 0,
      guests:     payload.guests     ?? existing?.guests,
      extra_beds: payload.extra_beds ?? existing?.extra_beds,
      has_pwd:    payload.has_pwd    ?? existing?.has_pwd,
      has_senior: payload.has_senior ?? existing?.has_senior,
      start_at:   payload.start_at   ?? existing?.start_at,
      end_at:     payload.end_at     ?? existing?.end_at,
    });

    /* 4. update booking row */
    const { data, error } = await supabase
      .from("bookings")
      .update({
        start_at:        payload.start_at        ?? null,
        end_at:          payload.end_at           ?? null,
        room_id:         payload.room_id          ?? null,
        guests:          payload.guests           ?? null,
        extra_beds:      payload.extra_beds       ?? null,
        has_child:       payload.has_child        ?? null,
        child_age_group: payload.child_age_group  ?? null,
        has_pwd:         payload.has_pwd          ?? null,
        has_senior:      payload.has_senior       ?? null,
        total_amount:    totals.totalAmount,
      })
      .eq("id", id)
      .select(this.BOOKING_SELECT)
      .single();

    if (error) throw error;
    return this.mapBooking(data);
  }

  /* =========================================================
    UPDATE STATUS
    — check_in  → rooms.status = 'occupied'
    — check_out → rooms.status = 'needs_cleaning'  + archive
    — cancelled / rejected → rooms.status = 'available' (if was occupied)
  ========================================================= */
  static async updateStatus(
    id: number,
    status: BookingStatus,
    actorId?: string
  ): Promise<BookingWithMeta> {
    const now = new Date().toISOString();

    /* 1. Build the booking update payload */
    const update: any = { status };

    if (status === "approved")    update.approved_by    = actorId ?? null;
    if (status === "rejected")    update.rejected_by    = actorId ?? null;
    if (status === "cancelled")   { /* no extra columns needed */ }

    if (status === "checked_in") {
      update.checked_in_by = actorId ?? null;
      update.checked_in_at = now;
    }

    if (status === "checked_out") {
      update.checked_out_by = actorId ?? null;
      update.checked_out_at = now;
    }

    /* 2. Fetch the current booking so we know room_id + current room status */
    const { data: current, error: currentErr } = await supabase
      .from("bookings")
      .select("room_id, status")
      .eq("id", id)
      .single();

    if (currentErr) {
      this.debug("updateStatus:fetchCurrent:error", currentErr);
      throw currentErr;
    }

    const roomId: number | null = current?.room_id ?? null;

    /* 3. Apply booking status update */
    const { data, error } = await supabase
      .from("bookings")
      .update(update)
      .eq("id", id)
      .select(this.BOOKING_SELECT)
      .single();

    if (error) {
      this.debug("updateStatus:error", error);
      throw error;
    }

    /* 4. Sync room status based on new booking status */
    if (roomId) {
      if (status === "checked_in") {
        // Mark the physical room as occupied
        await this.setRoomStatus(roomId, "occupied");

      } else if (status === "checked_out") {
        // Room needs cleaning after checkout; housekeeping picks it up
        await this.setRoomStatus(roomId, "needs_cleaning");

      } else if (status === "cancelled" || status === "rejected") {
        // Only free the room if it was occupied by this booking
        if (current?.status === "checked_in") {
          await this.setRoomStatus(roomId, "available");
        }
      }
    }

    /* 5. Post-checkout side-effects */
    if (status === "checked_out") {
      // Trigger housekeeping task from template
      await this.generateHousekeepingFromTemplate(data);

      // Archive a full snapshot of the booking
      const { data: fresh, error: freshErr } = await supabase
        .from("bookings")
        .select(`
          *,
          users!fk_bookings_user (id, fname, lname, email),
          rooms (
            id, room_number, floor, room_type_id,
            room_types ( id, name, capacity, base_price )
          )
        `)
        .eq("id", id)
        .single();

      if (freshErr || !fresh) {
        console.error("[BookingService] fresh fetch failed, archiving with stale data:", freshErr);
        await this.archiveBooking(data);
      } else {
        await this.archiveBooking(fresh);
      }
    }

    return this.mapBooking(data);
  }

  /* =========================================================
    HOUSEKEEPING ENGINE
  ========================================================= */
  private static async generateHousekeepingFromTemplate(
    booking: any
  ): Promise<void> {
    if (!booking?.room_id) return;

    const { data: room } = await supabase
      .from("rooms")
      .select("room_type_id")
      .eq("id", booking.room_id)
      .single();

    if (!room?.room_type_id) return;

    const { data: template } = await supabase
      .from("housekeeping_templates")
      .select("id")
      .eq("room_type_id", room.room_type_id)
      .single();

    if (!template?.id) return;

    const { data: task } = await supabase
      .from("housekeeping_tasks")
      .insert({
        room_id:    booking.room_id,
        booking_id: booking.id,
        template_id: template.id,
        status:     "pending",
      })
      .select()
      .single();

    if (!task?.id) return;

    const { data: items } = await supabase
      .from("housekeeping_template_items")
      .select("item_name, default_quantity")
      .eq("template_id", template.id);

    if (!items?.length) return;

    await supabase.from("housekeeping_task_items").insert(
      items.map((i) => ({
        task_id:   task.id,
        item_name: i.item_name,
        quantity:  i.default_quantity,
        is_done:   false,
      }))
    );
  }

  /* =========================================================
    ARCHIVE BOOKING (snapshot on checkout)
  ========================================================= */
  private static async archiveBooking(booking: any): Promise<void> {
    if (!booking) return;

    const room     = booking?.rooms;
    const roomType = room?.room_types;

    const totals = this.computeBookingTotals({
      price_at_booking: booking.price_at_booking,
      guests:     booking.guests,
      extra_beds: booking.extra_beds,
      has_pwd:    booking.has_pwd,
      has_senior: booking.has_senior,
      start_at:   booking.start_at,
      end_at:     booking.end_at,
    });

    const { error } = await supabase.from("archived_bookings").insert({
      original_booking_id: booking.id,
      user_id:             booking.user_id,
      room_id:             booking.room_id,

      room_number:     room?.room_number    ?? null,
      room_type_name:  roomType?.name       ?? null,
      room_type_id:    roomType?.id         ?? null,
      room_capacity:   roomType?.capacity   ?? null,
      room_base_price: roomType?.base_price ?? null,
      room_floor:      room?.floor          ?? null,

      start_at:        booking.start_at       ?? null,
      end_at:          booking.end_at         ?? null,
      checked_in_at:   booking.checked_in_at  ?? null,
      checked_out_at:  booking.checked_out_at ?? null,

      guests:         booking.guests   ?? 0,
      status:         booking.status   ?? "unknown",
      message:        booking.message  ?? null,
      payment_method: booking.payment_method ?? "unknown",
      total_amount:   totals.totalAmount,
      extra_beds:     booking.extra_beds ?? 0,

      has_child:       booking.has_child       ?? false,
      has_pwd:         booking.has_pwd         ?? false,
      has_senior:      booking.has_senior      ?? false,
      child_age_group: booking.child_age_group ?? null,

      guest_fname: booking.users?.fname ?? null,
      guest_lname: booking.users?.lname ?? null,

      approved_by:    booking.approved_by    ?? null,
      rejected_by:    booking.rejected_by    ?? null,
      checked_in_by:  booking.checked_in_by  ?? null,
      checked_out_by: booking.checked_out_by ?? null,
    });

    if (error) {
      console.error("[BookingService] archiveBooking error:", error);
    }
  }
}