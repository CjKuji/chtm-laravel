import React from 'react';

import type { ArchivedFolioBooking } from './ArchivedFolioPanel';

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('en-US') : '—';

const money = (value: number | null | undefined) =>
  `₱${Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function ArchivedFolioPrintButton({
  booking,
}: {
  booking: ArchivedFolioBooking | null;
}) {
  const handlePrint = () => {
    if (!booking) return;

    const guestName = `${booking.guest_fname ?? ''} ${booking.guest_lname ?? ''}`.trim() || 'Unknown Guest';

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Folio - ${guestName}</title>
<style>
  body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:24px; color:#111827;}
  .wrap{max-width:820px; margin:0 auto;}
  h1{font-size:20px; margin:0 0 6px;}
  .sub{font-size:12px; color:#6b7280; margin:0 0 18px;}
  .grid{display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:12px;}
  .card{border:1px solid #e5e7eb; border-radius:10px; padding:12px; background:#fff;}
  .label{font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.02em;}
  .value{font-weight:600; margin-top:6px;}
  .right{display:flex; justify-content:space-between; gap:12px; align-items:flex-start;}
  .amount{font-size:26px; font-weight:800; color:#16a34a;}
  table{width:100%; border-collapse:collapse; margin-top:12px;}
  th,td{border-bottom:1px solid #e5e7eb; padding:10px 0; text-align:left; font-size:13px;}
  th{color:#6b7280; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:.02em;}
  .footer{margin-top:22px; font-size:12px; color:#6b7280;}
  @media print{ .no-print{display:none;} }
</style>
</head>
<body>
  <div class="wrap">
    <div class="right">
      <div>
        <h1>CHTM-RRS • Guest Folio</h1>
        <div class="sub">Archived booking #${booking.id ?? ''}</div>
      </div>
      <div class="card no-print" style="padding:10px 12px;">
        <div class="label">Status</div>
        <div class="value">${booking.status ?? 'archived'}</div>
      </div>
    </div>

    <div class="card" style="margin-top:12px;">
      <div class="label">Guest</div>
      <div class="value" style="font-size:16px;">${guestName}</div>

      <div class="grid">
        <div class="card" style="box-shadow:none; background:#f9fafb;">
          <div class="label">Room</div>
          <div class="value">${booking.room_number ?? '—'}${booking.room_type_name ? ` · ${booking.room_type_name}` : ''}</div>
        </div>
        <div class="card" style="box-shadow:none; background:#f9fafb;">
          <div class="label">Stay Dates</div>
          <div class="value">${formatDate(booking.start_at)} — ${formatDate(booking.end_at)}</div>
        </div>
      </div>

      <div class="grid">
        <div class="card" style="box-shadow:none; background:#f9fafb;">
          <div class="label">Check-in</div>
          <div class="value">${formatDate(booking.checked_in_at)}</div>
        </div>
        <div class="card" style="box-shadow:none; background:#f9fafb;">
          <div class="label">Check-out</div>
          <div class="value">${formatDate(booking.checked_out_at)}</div>
        </div>
      </div>

      <div style="margin-top:14px; display:flex; justify-content:space-between; gap:18px; align-items:flex-start;">
        <div>
          <div class="label">Total Amount</div>
          <div class="amount">${money(booking.total_amount)}</div>
        </div>
        <div style="min-width:260px;">
          <div class="label">Payment</div>
          <div class="value">${booking.payment_method ?? '—'}</div>

          <div style="height:10px"></div>

          <table>
            <thead>
              <tr><th colspan="2">Booking Summary</th></tr>
            </thead>
            <tbody>
              <tr><td>Guests</td><td style="text-align:right; font-weight:700;">${booking.guests ?? '—'}</td></tr>
              <tr><td>Extra Beds</td><td style="text-align:right; font-weight:700;">${booking.extra_beds ?? 0}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="footer">
      Generated from archived booking snapshot on ${new Date().toLocaleString('en-US')}.
    </div>
  </div>

  <script>
    window.onload = function(){
      window.print();
    };
  </script>
</body>
</html>`;

    const w = window.open('', '_blank');

    if (!w) {
    alert('Please allow popups for printing.');
    return;
    }

    w.document.open();
    w.document.write(html);
    w.document.close();

    w.focus();

    // Wait for content/styles to fully render
    setTimeout(() => {
    w.print();

    // Optional auto-close after print
    w.onafterprint = () => {
        w.close();
    };
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={!booking}
      className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Print Folio
    </button>
  );
}

