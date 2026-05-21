import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import { useSidebar } from '@/app/context/SidebarContext';
import RequireRole from '@/app/components/RequireRole';
import { GuardedPageSkeleton } from '@/app/components/Skeletons/GuardedPageSkeleton';
import ArchivedFolioPanel from '@/app/components/Folio/ArchivedFolioPanel';
import ArchivedFolioPrintButton from '@/app/components/Folio/ArchivedFolioPrintButton';
import { FiInbox } from 'react-icons/fi';

interface ArchivedBooking {
  id: number;
  original_booking_id: number | null;
  room_number: string | null;
  room_type_name: string | null;
  room_floor: number | null;
  start_at: string | null;
  end_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  total_amount: number | null;
  status: string | null;
  guest_fname: string | null;
  guest_lname: string | null;
  payment_method: string | null;
  // Extra fields consumed by ArchivedModal (may be null depending on view).
  approved_by_user?: any;
  checked_in_by_user?: any;
  checked_out_by_user?: any;
  has_child?: boolean;
  has_pwd?: boolean;
  has_senior?: boolean;
  message?: string | null;
  extra_beds?: number | null;
  guests?: number | null;
}

export default function ArchivedPage() {
  return (
    <RequireRole allowedRoles={['frontoffice', 'admin']}>
      <ArchivedPageInner />
    </RequireRole>
  );
}

function ArchivedPageInner() {
  const { collapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string | null>(null);
  const [archivedBookings, setArchivedBookings] = useState<ArchivedBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ArchivedBooking | null>(null);

  useEffect(() => {
    const loadArchivedBookings = async () => {
      setLoading(true);
      setErrors(null);

      const { data, error } = await supabase
        .from('archived_bookings')
        .select(
          `id,
           original_booking_id,
           room_number,
           room_type_name,
           room_floor,
           start_at,
           end_at,
           checked_in_at,
           checked_out_at,
           total_amount,
           status,
           guest_fname,
           guest_lname,
           payment_method,
           approved_by,
           checked_in_by,
           checked_out_by,
           has_child,
           has_pwd,
           has_senior,
           message,
           extra_beds,
           guests`
        )
        .order('checked_out_at', { ascending: false });

      if (error) {
        setErrors(error.message);
        setArchivedBookings([]);
      } else {
        setArchivedBookings((data ?? []) as ArchivedBooking[]);
      }

      setLoading(false);
    };

    loadArchivedBookings();
  }, []);

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('en-US') : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeMenu="archived" />
      <main className={`pt-16 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar />

        <div className="space-y-6 p-4 sm:p-6">
          <div>
            <h1 className="text-xl font-semibold">Archived Bookings</h1>
            <p className="text-sm text-gray-500">
              Review completed and archived reservation records.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_700px] gap-4 items-start">
            {/* LEFT: List */}
            <div className="flex h-[calc(100vh-195px)] flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4">
                  <GuardedPageSkeleton />
                </div>
              ) : errors ? (
                <div className="p-4 text-sm text-red-600">
                  Error: {errors}
                </div>
              ) : archivedBookings.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                  No archived bookings found.
                </div>
              ) : (
                <>
                  {/* SCROLLABLE TABLE AREA */}
                  <div className="flex-1 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-sm divide-y divide-gray-200">
                      {/* STICKY HEADER */}
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left font-semibold text-gray-700">
                            Guest
                          </th>

                          <th className="px-3 py-3 text-left font-semibold text-gray-700">
                            Room
                          </th>

                          <th className="px-3 py-3 text-left font-semibold text-gray-700">
                            Stay Dates
                          </th>

                          <th className="px-3 py-3 text-left font-semibold text-gray-700">
                            Total
                          </th>

                          <th className="px-3 py-3 text-left font-semibold text-gray-700">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white">
                        {archivedBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`cursor-pointer transition-colors duration-150 ${
                              selectedBooking?.id === booking.id
                                ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-3 py-3 text-gray-700">
                              {booking.guest_fname || booking.guest_lname
                                ? `${booking.guest_fname ?? ''} ${
                                    booking.guest_lname ?? ''
                                  }`.trim()
                                : 'Guest'}
                            </td>

                            <td className="px-3 py-3 text-gray-700">
                              {booking.room_number || '—'}

                              <div className="text-xs text-gray-500">
                                {booking.room_type_name || 'Unknown Type'}
                              </div>
                            </td>

                            <td className="px-3 py-3 text-gray-700">
                              {formatDate(booking.start_at)} —{' '}
                              {formatDate(booking.end_at)}
                            </td>

                            <td className="px-3 py-3 text-gray-700">
                              {booking.total_amount != null
                                ? `₱${booking.total_amount.toLocaleString('en-PH', {
                                    minimumFractionDigits: 2,
                                  })}`
                                : '—'}
                            </td>

                            <td className="px-3 py-3 capitalize text-teal-700">
                              {booking.status || 'archived'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* FOOTER */}
                  <div className="flex items-center justify-center gap-2 border-t bg-gray-50 px-4 py-3 text-sm text-gray-400">
                    <FiInbox className="text-sm" />

                    <span>
                      You’ve reached the end of archived bookings
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: Detailed Folio panel */}
            <aside className="lg:sticky lg:top-20">
              <div className="space-y-4">
                {/* Folio panel uses selectedBooking from the modal selection */}
                {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
                <ArchivedFolioPanel booking={selectedBooking} />

                {selectedBooking && (
                  <div className="flex items-center justify-between px-2">
                    <div className="text-xs text-gray-500">
                      Printing uses browser print dialog.
                    </div>
                    <ArchivedFolioPrintButton booking={selectedBooking} />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
