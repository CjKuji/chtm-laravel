
import { useEffect, useState } from 'react';
import { BookingService } from '@/app/services/booking.service';
import { BookingWithMeta } from '@/types/booking.types';



const formatDateTime = (date?: string | null) =>
  date
    ? new Date(date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

const formatCurrency = (value?: number | string | null) => {
  const num = Number(value ?? 0);
  return `₱${num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })}`;
};




function StatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-blue-50 text-blue-700 ring-blue-200',
    checked_in: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    checked_out: 'bg-gray-100 text-gray-700 ring-gray-200',

  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 capitalize ${
        styles[status || ''] || 'bg-gray-100 text-gray-600 ring-gray-200'
      }`}
    >
      {status?.replace('_', ' ') || 'unknown'}
    </span>
  );
}



function Section({
  title,
  children,
}: {
  title: string;
  children: import('react').ReactNode;
}) {

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
        {title}
      </h3>
      <div className="rounded-xl border bg-gray-50 p-4">
        {children}
      </div>
    </div>
  );
}



interface Props {
  bookingId: number | null;
  onClose: () => void;
  onApprove: (id: number) => void | Promise<void>;
  onCheckIn: (id: number) => void | Promise<void>;
  onCheckOut: (id: number) => void | Promise<void>;
  onEditBooking?: (id: number, payload: any) => void | Promise<void>;
}






export default function ReservationModal({
  bookingId,
  onClose,
  onApprove,
  onCheckIn,
  onCheckOut,
  onEditBooking,
}: Props) {
  const [editMode, setEditMode] = useState(false);

  const [draftStartAt, setDraftStartAt] = useState<string>('');
  const [draftEndAt, setDraftEndAt] = useState<string>('');
  const [draftGuests, setDraftGuests] = useState<number | ''>('');
  const [draftExtraBeds, setDraftExtraBeds] = useState<number | ''>('');

  const [draftRoomTypeName, setDraftRoomTypeName] = useState<string>('');
  const [draftHasChild, setDraftHasChild] = useState<boolean>(false);
  const [draftChildAgeGroup, setDraftChildAgeGroup] = useState<string>('');
  const [draftHasPwd, setDraftHasPwd] = useState<boolean>(false);
  const [draftHasSenior, setDraftHasSenior] = useState<boolean>(false);

  const [draftError, setDraftError] = useState<string | null>(null);

  const [savingEdits, setSavingEdits] = useState(false);

  const [booking, setBooking] = useState<BookingWithMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    (async () => {
      setLoading(true);
      try {
        const data = await BookingService.getById(bookingId);
        setBooking(data ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  if (!bookingId) return null;

  const runAction = async (action: () => Promise<any> | void) => {
    try {
      setActionLoading(true);
      await action();
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================
    FIXED MAPPINGS
  ========================= */

  const guest = booking?.users;

  const guestName =
    guest?.fname || guest?.lname
      ? `${guest?.fname ?? ''} ${guest?.lname ?? ''}`.trim()
      : 'Unknown Guest';

  const guestEmail = guest?.email ?? 'No email provided';

  const roomType =
    booking?.room?.room_type?.name ?? 'Unknown Type';

  const amenities: string[] = booking?.amenities ?? [];


  const extraBedCost = booking?.extra_bed_fee ?? 0;

  const totalAmount = Number(booking?.total_amount ?? 0);

  /* =========================
    TIMELINE
  ========================= */

  const startAt = booking?.start_at;
  const endAt = booking?.end_at;

  const isStandard = roomType.toLowerCase().includes('standard');

  const checkedInAt = booking?.checked_in_at;
  const checkedOutAt = booking?.checked_out_at;

  const paymentMethod = booking?.payment_method ?? '—';

  /* =========================
    UI
========================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-start border-b p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Booking Details
            </h2>
            <p className="text-sm text-gray-500">{guestName}</p>
            <p className="text-xs text-gray-400">{guestEmail}</p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">

          {loading ? (
            <p className="text-sm text-gray-500">Loading booking...</p>
          ) : (
            <>
              <StatusBadge status={booking?.status} />

              <div className="grid md:grid-cols-2 gap-5">

                <Section title="Guest">
                  <p className="font-medium text-gray-900">{guestName}</p>
                  <p className="text-xs text-gray-500">{guestEmail}</p>
                </Section>

                <Section title="Room Type">
                  {editMode ? (
                    <div className="space-y-2">
                      <input
                        value={draftRoomTypeName}
                        onChange={(e) => setDraftRoomTypeName(e.target.value)}
                        placeholder="Room type name"
                        className="w-full border px-2 py-1 rounded text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Current: {roomType}
                      </p>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{roomType}</p>
                  )}
                </Section>

                <Section title="Stay Timeline">
                  {editMode ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          Start At
                        </label>
                        <input
                          type="datetime-local"
                          value={draftStartAt}
                          onChange={(e) => setDraftStartAt(e.target.value)}
                          className="w-full border px-2 py-1 rounded text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          End At
                        </label>
                        <input
                          type="datetime-local"
                          value={draftEndAt}
                          onChange={(e) => setDraftEndAt(e.target.value)}
                          className="w-full border px-2 py-1 rounded text-sm mt-1"
                        />
                      </div>
                      <p className="col-span-2 text-xs text-gray-500">
                        Check-in/out remain read-only.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p>Start At: {formatDateTime(startAt)}</p>
                      <p>End At: {formatDateTime(endAt)}</p>
                      <p>Check-in: {formatDateTime(checkedInAt)}</p>
                      <p>Check-out: {formatDateTime(checkedOutAt)}</p>
                    </>
                  )}
                </Section>

                <Section title="Payment">
                  {editMode ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          Guests
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={isStandard ? 4 : undefined}
                          value={draftGuests}
                          onChange={(e) =>
                            setDraftGuests(
                              e.target.value === ''
                                ? ''
                                : Number(e.target.value)
                            )
                          }
                          className="w-full border px-2 py-1 rounded text-sm mt-1"
                        />
                        {isStandard && (
                          <p className="text-[10px] text-amber-600 mt-1">Standard rooms limited to 4 guests max.</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          Extra Beds
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          value={draftExtraBeds}
                          onChange={(e) =>
                            setDraftExtraBeds(
                              e.target.value === ''
                                ? ''
                                : Number(e.target.value)
                            )
                          }
                          className="w-full border px-2 py-1 rounded text-sm mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Fee preview: {formatCurrency(BookingService.getExtraBedFee(Number(draftExtraBeds || 0)))}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>Method: {paymentMethod}</p>
                      <p>
                        Extra Beds: {booking?.extra_bed_label} — {formatCurrency(extraBedCost)}
                      </p>
                      <p className="font-semibold text-lg">
                        Total: {formatCurrency(totalAmount)}
                      </p>
                    </>
                  )}
                </Section>

                <Section title="Amenities">
                  {amenities.length ? (
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((a, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No amenities</p>
                  )}
                </Section>

                <Section title="Guest Info">
                  {editMode ? (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draftHasChild}
                          onChange={(e) => setDraftHasChild(e.target.checked)}
                        />
                        Has Child
                      </label>

                      {draftHasChild && (
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Child Age Group (3-12 Years)
                          </label>
                          <input
                            value={draftChildAgeGroup}
                            onChange={(e) => setDraftChildAgeGroup(e.target.value)}
                            placeholder="e.g. 0-5, 6-12"
                            className="w-full border px-2 py-1 rounded text-sm mt-1"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draftHasPwd}
                          onChange={(e) => setDraftHasPwd(e.target.checked)}
                        />
                        PWD Guest
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draftHasSenior}
                          onChange={(e) => setDraftHasSenior(e.target.checked)}
                        />
                        Senior Guest
                      </label>

                      {draftError && (
                        <p className="text-xs text-red-600">{draftError}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <p>
                        Children on reservation:{' '}
                        {booking?.has_child ? 'Yes' : 'No'}
                      </p>
                      {booking?.has_child && booking?.child_age_group ? (
                        <p>Child age group: {booking.child_age_group}</p>
                      ) : null}
                      <p>{booking?.has_pwd ? '✓ PWD Guest' : 'No PWD'}</p>
                      <p>{booking?.has_senior ? '✓ Senior Guest' : 'No Senior'}</p>
                    </>
                  )}
                </Section>

              </div>
            </>
          )}
        </div>

        {/* ACTIONS */}
        {!loading && booking && (
          <div className="flex justify-end gap-2 border-t p-5">

            <button
              onClick={() => {
                if (!booking) return;

                if (!editMode) {

                  setDraftStartAt(booking.start_at ? booking.start_at.slice(0, 16) : '');
                  setDraftEndAt(booking.end_at ? booking.end_at.slice(0, 16) : '');
                  setDraftGuests(booking.guests ?? '');
                  setDraftExtraBeds(booking.extra_beds ?? '');

                  setDraftRoomTypeName(booking.room?.room_type?.name ?? '');

                  setDraftHasChild(Boolean(booking.has_child));
                  setDraftChildAgeGroup(booking.child_age_group ?? '');
                  setDraftHasPwd(Boolean(booking.has_pwd));
                  setDraftHasSenior(Boolean(booking.has_senior));

                  setDraftError(null);
                }

                setEditMode((v) => !v);
              }}
              className={
                editMode
                  ? 'px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg'
                  : 'px-4 py-2 text-sm bg-gray-800 text-white rounded-lg'
              }
            >
              {editMode ? 'Cancel Edit' : 'Edit Booking'}
            </button>



            {booking.status === 'pending' && (
              <button
                disabled={actionLoading || (booking.has_child && !booking.child_age_group)}
                onClick={() => {
                  if (booking.has_child && !booking.child_age_group) {
                    return;
                  }

                  // Payment-verified workflow:
                  // Move booking to "approved" only if payment is explicitly verified.
                  // If your backend exposes a receipt verification flag, integrate it here.
                  // Current UI uses payment_method presence as a minimal gate.
                  if (!booking.payment_method) {
                    return;
                  }

                  runAction(() => onApprove(booking.id));
                }}
                className={
                  booking.has_child && !booking.child_age_group
                    ? 'px-4 py-2 text-sm bg-emerald-300 text-white rounded-lg opacity-70'
                    : 'px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg'
                }
              >
                Approve
              </button>
            )}


            {booking.status === 'approved' && (
              <button
                disabled={actionLoading || (booking.has_child && !booking.child_age_group)}
                onClick={() => {
                  if (booking.has_child && !booking.child_age_group) {
                    return;
                  }
                  runAction(() => onCheckIn(booking.id));
                }}
                className={
                  booking.has_child && !booking.child_age_group
                    ? 'px-4 py-2 text-sm bg-blue-300 text-white rounded-lg opacity-70'
                    : 'px-4 py-2 text-sm bg-blue-600 text-white rounded-lg'
                }
              >
                Check In
              </button>
            )}


            {booking.status === 'checked_in' && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => onCheckOut(booking.id))}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
              >
                Check Out
              </button>
            )}

            {editMode ? (
              <button
                onClick={async () => {
                  if (!booking) return;
                  if (!onEditBooking) return;


                  if (draftHasChild && !draftChildAgeGroup.trim()) {
                    setDraftError('Selected Party is incomplete: child_age_group is required.');
                    return;
                  }

                  setSavingEdits(true);
                  setDraftError(null);

                  try {
                    await onEditBooking(booking.id, {
                      start_at: draftStartAt ? new Date(draftStartAt).toISOString() : null,
                      end_at: draftEndAt ? new Date(draftEndAt).toISOString() : null,

                      guests: draftGuests === '' ? null : Number(draftGuests),
                      extra_beds:
                        draftExtraBeds === '' ? null : Number(draftExtraBeds),

                      has_child: draftHasChild,
                      child_age_group: draftHasChild && draftChildAgeGroup.trim() ? draftChildAgeGroup.trim() : null,

                      has_pwd: draftHasPwd,
                      has_senior: draftHasSenior,


                      room_id: null,
                    });

                    setEditMode(false);
                    setDraftError(null);
                  } catch (e: any) {
                    setDraftError(e?.message ?? 'Failed to save edits');
                  } finally {
                    setSavingEdits(false);
                  }
                }}
                disabled={savingEdits}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg"
              >
                {savingEdits ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg"
              >
                Close
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
}