import { useRef, useCallback } from 'react';

export function usePrint() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Audit Report — CHTM RRS</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a2e;background:#fff;padding:24px}
    .print-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f766e;padding-bottom:16px;margin-bottom:20px}
    .hotel-name{font-size:22px;font-weight:800;color:#0f766e}
    .hotel-sub{font-size:11px;color:#6b7280}
    .report-meta{text-align:right;font-size:11px;color:#374151}
    .report-meta strong{display:block;font-size:16px;color:#111827}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
    .stat-card{border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#f9fafb}
    .stat-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
    .stat-value{font-size:20px;font-weight:700;color:#111827;margin-top:4px}
    .stat-value.green{color:#059669}
    .stat-value.red{color:#dc2626}
    h2{font-size:14px;font-weight:700;color:#0f766e;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #d1fae5}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:11px}
    thead th{background:#0f766e;color:#fff;padding:8px 10px;text-align:left;font-weight:600}
    tbody tr:nth-child(even){background:#f0fdf4}
    tbody td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
    tfoot td{padding:8px 10px;font-weight:700;background:#e6fffa;border-top:2px solid #0f766e}
    .section{margin-bottom:28px;page-break-inside:avoid}
    .print-footer{margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af}
    @media print{body{padding:16px}}
  </style>
</head>
<body>
  ${content}
  <div class="print-footer">
    <span>CHTM RRS — Hotel Management System</span>
    <span>Generated: ${new Date().toLocaleString()}</span>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  }, []);

  return { printRef, handlePrint };
}