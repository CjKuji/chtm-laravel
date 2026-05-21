import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookingService } from '@/app/services/booking.service';
import { RoomService } from '@/app/services/room.service';
import { ReceiptService } from '@/app/services/receipt.service';
import { BookingWithMeta } from '@/types/booking.types';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import RequireRole from '@/app/components/RequireRole';
import { useSidebar } from '@/app/context/SidebarContext';
import { GuardedPageSkeleton } from '@/app/components/Skeletons/GuardedPageSkeleton';


interface BookingEditForm {
  guest_fname: string;
  guest_lname: string;
  guest_email: string;
  start_at: string;
  end_at: string;
  room_id: number | null;
  guests: number;
  extra_beds: number;
  has_child: boolean;
  child_age_group: string;
  has_pwd: boolean;
  has_senior: boolean;
}

interface RoomTypeOption {
  id: number;
  name: string;
  capacity: number;
}

interface ReceiptFile {
  name: string;
  id: string;
  updated_at: string;
  size: number;
  path: string;
}

const emptyEditForm: BookingEditForm = {
  guest_fname: '',
  guest_lname: '',
  guest_email: '',
  start_at: '',
  end_at: '',
  room_id: null,
  guests: 1,
  extra_beds: 0,
  has_child: false,
  child_age_group: '',
  has_pwd: false,
  has_senior: false,
};

function toInputDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  if (!value) return '';
  return new Date(value).toISOString();
}

function extractLastName(value?: string | null) {
  if (!value) return '';
  const parts = value.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : value.trim();
}

export default function FrontOfficePage() {
  return (
    <RequireRole allowedRoles={['frontoffice', 'super_admin', 'admin']}>
      <FrontOfficePageInner />
    </RequireRole>
  );
}

function FrontOfficePageInner() {
  const { collapsed } = useSidebar();
  const [tab, setTab] = useState<'bookings' | 'receipts'>('bookings');
  const [bookings, setBookings] = useState<BookingWithMeta[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithMeta | null>(null);
  const [editForm, setEditForm] = useState<BookingEditForm>(emptyEditForm);
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [receiptFiles, setReceiptFiles] = useState<ReceiptFile[]>([]);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [bookingsData, roomTypesData] = await Promise.all([
          BookingService.getAll(),
          RoomService.getRoomTypes(),
        ]);

        setBookings(bookingsData);
        setRoomTypes(
          roomTypesData.map((type: any) => ({
            id: type.id,
            name: type.name,
            capacity: type.capacity,
          }))
        );
      } catch (err: any) {
        setError(err?.message || 'Failed to load front office data.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-frontoffice-bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        async () => {
          const data = await BookingService.getAll();
          setBookings(data);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        async () => {
          const data = await BookingService.getAll();
          setBookings(data);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookings' },
        async () => {
          const data = await BookingService.getAll();
          setBookings(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadReceipts = async () => {
    setReceiptsLoading(true);
    setReceiptError(null);

    try {
      const list = await ReceiptService.listReceipts();
      setReceiptFiles(
        list.map((item) => ({
          id: item.id ?? item.name,
          name: item.name,
          path: item.name,
          updated_at: item.updated_at ?? '',
          size: Number(item.metadata?.size ?? 0),
        }))
      );
    } catch (err: any) {
      setReceiptError(err?.message || 'Unable to load receipts from storage.');
    } finally {
      setReceiptsLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'receipts') return;
    loadReceipts();
  }, [tab]);

  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});
  }, [bookings]);

  const selectBooking = (booking: BookingWithMeta) => {
    setSelectedBooking(booking);
    setEditErrors([]);
    setSuccessMessage(null);

    setEditForm({
      guest_fname: booking.users?.fname ?? '',
      guest_lname: extractLastName(booking.users?.lname ?? ''),
      guest_email: booking.users?.email ?? '',
      start_at: toInputDateTime(booking.start_at),
      end_at: toInputDateTime(booking.end_at ?? ''),
      room_id: booking.room?.id ?? null,
      guests: booking.guests ?? 1,
      extra_beds: booking.extra_beds ?? 0,
      has_child: booking.has_child ?? false,
      child_age_group: booking.child_age_group ?? '',
      has_pwd: booking.has_pwd ?? false,
      has_senior: booking.has_senior ?? false,
    });
  };

  const validateBookingForm = () => {
    const validation: string[] = [];

    if (!editForm.guest_fname.trim()) {
      validation.push('Selected Party: First name is required.');
    }
    if (!editForm.guest_lname.trim()) {
      validation.push('Selected Party: Last name is required.');
    }
    if (!editForm.guest_email.trim()) {
      validation.push('Selected Party: Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.guest_email)) {
      validation.push('Selected Party: Email must be valid.');
    }
    if (!editForm.room_id) {
      validation.push('Please select a room type before saving.');
    }
    if (!editForm.start_at) {
      validation.push('Start date/time is required.');
    }
    if (!editForm.end_at) {
      validation.push('End date/time is required.');
    }
    if (editForm.start_at && editForm.end_at) {
      if (new Date(editForm.start_at) >= new Date(editForm.end_at)) {
        validation.push('End date/time must be later than start date/time.');
      }
    }
    if (editForm.guests <= 0) {
      validation.push('Number of guests must be at least 1.');
    }

    return validation;
  };

  const saveBooking = async () => {
    if (!selectedBooking) return;

    const validation = validateBookingForm();
    if (validation.length > 0) {
      setEditErrors(validation);
      return;
    }

    setSaving(true);
    setEditErrors([]);
    setSuccessMessage(null);

    try {
      const updatedBooking = await BookingService.updateBookingDetails(
        selectedBooking.id,
        {
          start_at: toIsoString(editForm.start_at),
          end_at: toIsoString(editForm.end_at),
          room_id: editForm.room_id,
          guests: editForm.guests,
          extra_beds: editForm.extra_beds,
          has_child: editForm.has_child,
          child_age_group: editForm.child_age_group || null,
          has_pwd: editForm.has_pwd,
          has_senior: editForm.has_senior,
          guest_fname: editForm.guest_fname,
          guest_lname: editForm.guest_lname,
          guest_email: editForm.guest_email,
        }
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === updatedBooking.id ? updatedBooking : booking
        )
      );
      setSelectedBooking(updatedBooking);
      setSuccessMessage('Booking updated successfully.');
    } catch (err: any) {
      setEditErrors([err?.message || 'Failed to update booking.']);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setSelectedBooking(null);
    setEditForm(emptyEditForm);
    setEditErrors([]);
    setSuccessMessage(null);
  };

  const viewReceipt = async (path: string) => {
    setReceiptError(null);
    try {
      const url = await ReceiptService.getReceiptUrl(path);
      window.open(url, '_blank');
    } catch (err: any) {
      setReceiptError(err?.message || 'Could not generate receipt preview.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeMenu="frontoffice" />
      <Topbar />

      <main className={`pt-16 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Front Office Desk</h1>
              <p className="text-sm text-gray-500">
                Manage reservations, update guest details, and verify payment receipts.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow-sm">
                Total bookings: {bookings.length}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow-sm">
                Pending: {statusCounts.pending ?? 0}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow-sm">
                Approved: {statusCounts.approved ?? 0}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white border p-3 shadow-sm">
            <div className="mb-3 rounded-2xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-800">
              Tip: select a booking first, update the guest or date fields, then save. If you need to verify receipts, switch to the Receipt Verification tab.
            </div>
            <div className="flex flex-wrap gap-2">
              {(['bookings', 'receipts'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTab(option)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    tab === option
                      ? 'bg-pink-600 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option === 'bookings' ? 'Edit Booking' : 'Receipt Verification'}
                </button>
              ))}
            </div>
          </div>

          {tab === 'bookings' ? (
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <section className="rounded-xl bg-white border shadow-sm p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Bookings</h2>
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {loading ? 'Loading...' : `${bookings.length} records`}
                  </span>
                </div>

                {loading ? <GuardedPageSkeleton /> : null}

                {error ? (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
                ) : bookings.length === 0 && !loading ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                    No bookings found yet. Create a new reservation first, then return here to edit it.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Guest</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Room</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Dates</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">
                              <div className="font-medium">
                                {booking.users?.fname ?? 'Unknown'} {booking.users?.lname ?? ''}
                              </div>
                              <div className="text-xs text-gray-500">{booking.users?.email ?? 'No email'}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <div>{booking.room?.room_type?.name ?? 'Unknown Room'}</div>
                              <div className="text-xs text-gray-500">Room {booking.room?.room_number ?? '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <div>{new Date(booking.start_at).toLocaleString()}</div>
                              <div className="text-xs text-gray-500">
                                {booking.end_at ? new Date(booking.end_at).toLocaleString() : 'No end date'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 capitalize">{booking.status.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => selectBooking(booking)}
                                className="rounded-xl bg-pink-600 px-4 py-2 text-sm text-white transition hover:bg-pink-700"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl bg-white border shadow-sm p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Selected Party</h2>
                    <p className="text-sm text-gray-500">
                      Edit guest details and booking information before saving.
                    </p>
                  </div>
                </div>

                {!selectedBooking ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    Select a booking to start editing.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {successMessage && (
                      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div>
                    )}

                    {editErrors.length > 0 && (
                      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <ul className="list-disc list-inside">
                          {editErrors.map((message, index) => (
                            <li key={index}>{message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First name</label>
                        <input
                          value={editForm.guest_fname}
                          onChange={(e) => setEditForm({ ...editForm, guest_fname: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last name</label>
                        <input
                          value={editForm.guest_lname}
                          onChange={(e) => setEditForm({ ...editForm, guest_lname: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={editForm.guest_email}
                          onChange={(e) => setEditForm({ ...editForm, guest_email: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Start</label>
                          <input
                            type="datetime-local"
                            value={editForm.start_at}
                            onChange={(e) => setEditForm({ ...editForm, start_at: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">End</label>
                          <input
                            type="datetime-local"
                            value={editForm.end_at}
                            onChange={(e) => setEditForm({ ...editForm, end_at: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Room type</label>
                        <select
                          value={editForm.room_id ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, room_id: Number(e.target.value) || null })}
                          className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                        >
                          <option value="">Select room type</option>
                          {roomTypes.map((roomType) => (
                            <option key={roomType.id} value={roomType.id}>
                              {roomType.name} — capacity {roomType.capacity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Guests</label>
                          <input
                            type="number"
                            min={1}
                            value={editForm.guests}
                            onChange={(e) => setEditForm({ ...editForm, guests: Number(e.target.value) })}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Extra beds</label>
                          <input
                            type="number"
                            min={0}
                            value={editForm.extra_beds}
                            onChange={(e) => setEditForm({ ...editForm, extra_beds: Number(e.target.value) })}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editForm.has_child}
                            onChange={(e) => setEditForm({ ...editForm, has_child: e.target.checked })}
                          />
                          Has child
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editForm.has_pwd}
                            onChange={(e) => setEditForm({ ...editForm, has_pwd: e.target.checked })}
                          />
                          PWD guest
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editForm.has_senior}
                            onChange={(e) => setEditForm({ ...editForm, has_senior: e.target.checked })}
                          />
                          Senior guest
                        </label>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Child age group</label>
                          <input
                            value={editForm.child_age_group}
                            onChange={(e) => setEditForm({ ...editForm, child_age_group: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                            placeholder="e.g. 6-12 years"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={saveBooking}
                        className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <section className="rounded-xl bg-white border shadow-sm p-5">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Payment Receipt Verification</h2>
                  <p className="text-sm text-gray-500">
                    Review uploaded guest receipts and open copies directly from Supabase storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadReceipts}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                  Refresh receipts
                </button>
              </div>

              {receiptsLoading ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                  Loading receipt uploads...
                </div>
              ) : receiptError ? (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{receiptError}</div>
              ) : receiptFiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                  No receipt uploads found in the storage bucket.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Updated</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Size</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {receiptFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{file.name}</td>
                          <td className="px-4 py-3 text-gray-700">{new Date(file.updated_at).toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-700">{(file.size / 1024).toFixed(1)} KB</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => viewReceipt(file.path)}
                              className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white transition hover:bg-teal-700"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
