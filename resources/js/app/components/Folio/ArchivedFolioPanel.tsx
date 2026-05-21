import React from 'react';

export type ArchivedFolioBooking = {
  id: number;
  original_booking_id: number | null;
  room_number: string | null;
  room_type_name: string | null;
  start_at: string | null;
  end_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  total_amount: number | null;
  status: string | null;
  guest_fname: string | null;
  guest_lname: string | null;
  payment_method: string | null;
  extra_beds?: number | null;
  guests?: number | null;
  approved_by?: any;
  checked_in_by?: any;
  checked_out_by?: any;
 approved_by_user?: any;
  checked_in_by_user?: any;
  checked_out_by_user?: any;
  approved_by_user_id?: any;
  checked_in_by_user_id?: any;
  checked_out_by_user_id?: any;
  has_child?: boolean;
  has_pwd?: boolean;
  has_senior?: boolean;
  message?: string | null;
};

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('en-US') : '—';

export default function ArchivedFolioPanel({
  booking,
}: {
  booking: ArchivedFolioBooking | null;
}) {
  if (!booking) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Guest Folio</h2>

        <p className="mt-2 text-sm text-gray-500">
          Select an archived guest booking to view the folio.
        </p>
      </div>
    );
  }

  const guestName =
    `${booking.guest_fname ?? ''} ${booking.guest_lname ?? ''}`.trim() ||
    'Unknown Guest';

  const total = booking.total_amount ?? 0;

  const money = `₱${Number(total).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })}`;

  const formatUser = (user?: any) =>
    user ? `${user.fname ?? ''} ${user.lname ?? ''}`.trim() : null;

  const approvedBy = formatUser(
    booking.approved_by_user ??
      booking.approved_by ??
      booking.approved_by_user_id
  );

  const checkedInBy = formatUser(
    booking.checked_in_by_user ??
      booking.checked_in_by ??
      booking.checked_in_by_user_id
  );

  const checkedOutBy = formatUser(
    booking.checked_out_by_user ??
      booking.checked_out_by ??
      booking.checked_out_by_user_id
  );

  return (
    <div className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
      {/* HEADER */}
      <div className="flex items-start justify-between border-b pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">
            Archived Record #{booking.id}
          </p>

          <h2 className="mt-1 text-2xl font-bold leading-tight text-gray-900">
            {guestName}
          </h2>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase text-emerald-700">
            {booking.status ?? 'archived'}
          </div>

          <div className="flex gap-1.5">
            {booking.has_child && (
              <span
                title="Child"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600"
              >
                C
              </span>
            )}

            {booking.has_pwd && (
              <span
                title="PWD"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-600"
              >
                P
              </span>
            )}

            {booking.has_senior && (
              <span
                title="Senior"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-600"
              >
                S
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* ROOM DETAILS */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Room Details
            </p>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-indigo-700">
                {booking.room_number ?? 'N/A'}
              </span>

              <span className="text-base font-medium text-gray-500">
                {booking.room_type_name}
              </span>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Timeline
            </p>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400">Scheduled Stay</span>

                <span className="font-semibold text-gray-800">
                  {formatDate(booking.start_at)} -{' '}
                  {formatDate(booking.end_at)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-400">Payment Method</span>

                <span className="font-semibold uppercase text-gray-800">
                  {booking.payment_method ?? '—'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-400">Actual Check-in</span>

                <span className="font-semibold text-gray-800">
                  {formatDate(booking.checked_in_at)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-400">Actual Check-out</span>

                <span className="font-semibold text-gray-800">
                  {formatDate(booking.checked_out_at)}
                </span>
              </div>
            </div>
          </div>

          {/* BILLING */}
          <div className="space-y-3 rounded-xl border border-gray-200/70 bg-gray-50 p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Total Amount
              </p>

              <p className="mt-1 text-3xl font-black leading-none text-green-600">
                {money}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-200/60 pt-3">
              <div>
                <p className="text-sm text-gray-500">Guests</p>

                <p className="text-lg font-bold text-gray-900">
                  {booking.guests ?? '—'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Extra Beds</p>

                <p className="text-lg font-bold text-gray-900">
                  {booking.extra_beds ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* STAFF */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Staff Activity
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-gray-500">Approved By</span>

                <span className="font-semibold text-gray-800">
                  {approvedBy ?? '—'}
                </span>
              </div>

              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-gray-500">Checked In By</span>

                <span className="font-semibold text-gray-800">
                  {checkedInBy ?? '—'}
                </span>
              </div>

              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-gray-500">Checked Out By</span>

                <span className="font-semibold text-gray-800">
                  {checkedOutBy ?? '—'}
                </span>
              </div>
            </div>
          </div>

          {/* MESSAGE */}
          {booking.message && (
            <div className="rounded-xl border border-yellow-100 bg-yellow-50/60 p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-yellow-700">
                Guest Message
              </p>

              <p className="text-sm italic leading-relaxed text-yellow-900">
                "{booking.message}"
              </p>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            <span className="text-xl">ℹ</span>

            <p>
              This record is a permanent snapshot generated during guest
              checkout and archived for reporting purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}