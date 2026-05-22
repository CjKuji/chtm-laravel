import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  bookingId: number | null;
  onClose: () => void;
}

const statusStyles: Record<string, { badge: string; icon: string }> = {
  pending:     { badge: 'bg-amber-50 text-amber-800 border-amber-200',   icon: 'ti-clock'       },
  approved:    { badge: 'bg-blue-50 text-blue-800 border-blue-200',      icon: 'ti-check'       },
  checked_in:  { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',icon: 'ti-door-enter'  },
  checked_out: { badge: 'bg-green-50 text-green-800 border-green-200',   icon: 'ti-door-exit'   },
  cancelled:   { badge: 'bg-red-50 text-red-800 border-red-200',         icon: 'ti-x'           },
  rejected:    { badge: 'bg-rose-50 text-rose-800 border-rose-200',      icon: 'ti-ban'         },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <i className={`ti ${icon} text-gray-400 text-[14px]`} aria-hidden="true" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
      </div>
      <div className="px-4">{children}</div>
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
  const peso = (n: number | null) =>
    n != null ? `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—';

  const nights =
    booking?.end_at && booking?.start_at
      ? Math.max(1, Math.round(
          (new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 86400000
        ))
      : null;

  const status = booking?.status ?? '';
  const statusStyle = statusStyles[status] ?? { badge: 'bg-gray-100 text-gray-600 border-gray-200', icon: 'ti-circle' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
              <i className="ti ti-building text-green-800 text-[16px]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">Booking Detail</h2>
              <p className="text-xs text-gray-400">ID #{bookingId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <i className="ti ti-x text-[15px]" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading booking details…</p>
            </div>
          )}

          {!loading && !booking && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <i className="ti ti-file-off text-[36px] text-gray-300" aria-hidden="true" />
              <p className="text-sm">Booking not found</p>
            </div>
          )}

          {!loading && booking && (
            <div className="space-y-4">

              {/* Status */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${statusStyle.badge}`}>
                  <i className={`ti ${statusStyle.icon} text-[12px]`} aria-hidden="true" />
                  {status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <Section title="Guest Information" icon="ti-user">
                <InfoRow label="Name" value={`${booking.guest_fname ?? ''} ${booking.guest_lname ?? ''}`.trim() || '—'} />
                <InfoRow label="Guest count" value={booking.guests} />
                <InfoRow label="Extra beds" value={booking.extra_beds} />
                <InfoRow label="Children" value={booking.has_child ? `Yes${booking.child_age_group ? ` (${booking.child_age_group})` : ''}` : 'No'} />
                <InfoRow label="PWD" value={booking.has_pwd ? 'Yes' : 'No'} />
                <InfoRow label="Senior" value={booking.has_senior ? 'Yes' : 'No'} />
              </Section>

              <Section title="Room Details" icon="ti-door">
                <InfoRow label="Room number" value={booking.room_number} />
                <InfoRow label="Room type" value={booking.room_type_name} />
                <InfoRow label="Floor" value={booking.room_floor} />
                <InfoRow label="Capacity" value={booking.room_capacity} />
              </Section>

              <Section title="Stay Dates" icon="ti-calendar">
                <InfoRow label="Check-in" value={fmt(booking.start_at)} />
                <InfoRow label="Check-out" value={fmt(booking.end_at)} />
                <InfoRow label="Nights" value={nights} />
                <InfoRow label="Actual check-in" value={fmt(booking.checked_in_at)} />
                <InfoRow label="Actual check-out" value={fmt(booking.checked_out_at)} />
              </Section>

              <Section title="Financials" icon="ti-cash">
                <InfoRow label="Price at booking" value={peso(booking.price_at_booking)} />
                <InfoRow label="Total amount" value={peso(booking.total_amount)} />
                <InfoRow label="Payment method" value={booking.payment_method?.toUpperCase()} />
              </Section>

              {booking.message && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <i className="ti ti-notes text-[12px]" aria-hidden="true" /> Notes
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{booking.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-800 text-white rounded-lg text-sm font-medium hover:bg-green-900 transition"
          >
            <i className="ti ti-x text-[13px]" aria-hidden="true" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}