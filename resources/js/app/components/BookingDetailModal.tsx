import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  bookingId: number | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-indigo-100 text-indigo-800',
  checked_out: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-rose-100 text-rose-800',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-semibold text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  );
}

export default function BookingDetailModal({ bookingId, onClose }: Props) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    supabase
      .from('archived_bookings')
      .select('*')
      .eq('original_booking_id', bookingId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setBooking(data); setLoading(false); return; }
        // Try bookings table
        supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle()
          .then(({ data: b }) => { setBooking(b); setLoading(false); });
      });
  }, [bookingId]);

  if (!bookingId) return null;

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString() : '—';
  const peso = (n: number | null) => n != null ? `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—';

  const nights =
    booking?.end_at && booking?.start_at
      ? Math.max(1, Math.round((new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / (1000 * 60 * 60 * 24)))
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏨</span>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Booking Detail</h2>
              <p className="text-xs text-gray-500">ID #{bookingId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && !booking && (
            <p className="text-center text-gray-400 py-12">Booking not found</p>
          )}

          {!loading && booking && (
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${statusColors[booking.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {booking.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">Guest</p>
                <Row label="Name" value={`${booking.guest_fname ?? ''} ${booking.guest_lname ?? ''}`.trim() || '—'} />
                <Row label="Guests" value={booking.guests} />
                <Row label="Extra Beds" value={booking.extra_beds} />
                <Row label="Children" value={booking.has_child ? `Yes (${booking.child_age_group ?? ''})` : 'No'} />
                <Row label="PWD" value={booking.has_pwd ? 'Yes' : 'No'} />
                <Row label="Senior" value={booking.has_senior ? 'Yes' : 'No'} />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">Room</p>
                <Row label="Room Number" value={booking.room_number} />
                <Row label="Room Type" value={booking.room_type_name} />
                <Row label="Floor" value={booking.room_floor} />
                <Row label="Capacity" value={booking.room_capacity} />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">Dates</p>
                <Row label="Check In" value={fmt(booking.start_at)} />
                <Row label="Check Out" value={fmt(booking.end_at)} />
                <Row label="Nights" value={nights} />
                <Row label="Actual Check In" value={fmt(booking.checked_in_at)} />
                <Row label="Actual Check Out" value={fmt(booking.checked_out_at)} />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">Financials</p>
                <Row label="Price at Booking" value={peso(booking.price_at_booking)} />
                <Row label="Total Amount" value={peso(booking.total_amount)} />
                <Row label="Payment Method" value={booking.payment_method?.toUpperCase()} />
              </div>

              {booking.message && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{booking.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-700 text-white rounded-xl text-sm font-medium hover:bg-teal-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
