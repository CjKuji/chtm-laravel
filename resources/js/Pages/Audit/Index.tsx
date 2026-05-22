import { useState } from 'react';
import {
  IconChartPie,
  IconRefresh,
  IconAlertTriangle,
  IconChartBar,
  IconBuilding,
  IconUsers,
  IconClipboardList,
  IconInfoCircle,
} from '@tabler/icons-react';
import Sidebar from '@/app/components/Sidebar';
import { useSidebar } from '@/app/context/SidebarContext';
import { useAudit, AuditTab } from '@/app/hooks/useAudit';
import { usePrint } from '@/app/hooks/usePrint';
import { AuditLogRow } from '@/app/services/audit.service';

import AuditFilters from '@/app/components/AuditFilters';
import SummaryCards from '@/app/components/SummaryCards';
import SalesTab from '@/app/components/SalesTab';
import OccupancyTab from '@/app/components/OccupancyTab';
import GuestsTab from '@/app/components/GuestsTab';
import AuditLogsTab from '@/app/components/AuditLogsTab';
import PrintableReport from '@/app/components/PrintableReport';
import AuditLogDetailModal from '@/app/components/AuditLogDetailModal';
import BookingDetailModal from '@/app/components/BookingDetailModal';

const TABS: { id: AuditTab; label: string; icon: React.ElementType }[] = [
  { id: 'sales',     label: 'Sales & Revenue',  icon: IconChartBar      },
  { id: 'occupancy', label: 'Room Occupancy',    icon: IconBuilding      },
  { id: 'guests',    label: 'Guest Statistics',  icon: IconUsers         },
  { id: 'logs',      label: 'Audit Logs',        icon: IconClipboardList },
];

export default function AuditPage() {
  const { collapsed } = useSidebar();
  const audit = useAudit();
  const { printRef, handlePrint } = usePrint();

  const [selectedLog, setSelectedLog]             = useState<AuditLogRow | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  return (
    <>
      <Sidebar activeMenu="audit" />

      <div
        className={`min-h-screen bg-gray-50 transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-100 px-6 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Icon badge */}
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
                <IconChartPie size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">
                  Audit &amp; Reports
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Financial audit · Occupancy · Guest analytics · System trail
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 self-start sm:self-auto">
              <IconRefresh size={14} className="text-gray-300" />
              Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </header>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="p-4 sm:p-6 space-y-5 max-w-screen-2xl mx-auto">

          {/* Error Banner */}
          {audit.error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <IconAlertTriangle size={18} className="flex-shrink-0" />
              <span className="flex-1">{audit.error}</span>
              <button
                onClick={audit.refresh}
                className="ml-auto text-xs font-medium underline underline-offset-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters */}
          <AuditFilters
            period={audit.period}
            setPeriod={audit.setPeriod}
            year={audit.year}
            setYear={audit.setYear}
            month={audit.month}
            setMonth={audit.setMonth}
            quarter={audit.quarter}
            setQuarter={audit.setQuarter}
            loading={audit.loading}
            onRefresh={audit.refresh}
            onPrint={handlePrint}
            dateLabel={audit.dateLabel}
          />

          {/* KPI Cards */}
          <SummaryCards summary={audit.summary} loading={audit.loading} />

          {/* ── Tab Panel ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_6px_rgba(0,0,0,0.06)] overflow-hidden">

            {/* Tab Bar — scrollable on small screens */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100 bg-gray-50/60">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => audit.setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap
                      transition-colors duration-150 focus-visible:outline-none
                      ${audit.activeTab === tab.id
                        ? 'text-teal-700 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/70'
                      }
                    `}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {/* Active indicator */}
                    {audit.activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-600 rounded-t" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {audit.activeTab === 'sales' && (
                <SalesTab
                  rows={audit.revenueRows}
                  roomTypes={audit.roomTypeBreakdown}
                  loading={audit.loading}
                />
              )}
              {audit.activeTab === 'occupancy' && (
                <OccupancyTab rows={audit.occupancyRows} loading={audit.loading} />
              )}
              {audit.activeTab === 'guests' && (
                <GuestsTab stats={audit.guestStats} loading={audit.loading} />
              )}
              {audit.activeTab === 'logs' && (
                <AuditLogsTab
                  logs={audit.auditLogs}
                  count={audit.auditLogsCount}
                  page={audit.auditLogsPage}
                  setPage={audit.setAuditLogsPage}
                  loading={audit.loading}
                  onViewDetail={setSelectedLog}
                />
              )}
            </div>
          </div>

          {/* Guide Note */}
          <div className="flex gap-3 bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
            <IconInfoCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold">Audit Guide:</strong>{' '}
              <em>Sales &amp; Revenue</em> tracks all completed stays (checked-out).{' '}
              <em>Room Occupancy</em> shows which rooms generated the most revenue.{' '}
              <em>Guest Statistics</em> covers demographic data from all bookings in the period.{' '}
              <em>Audit Logs</em> is the full system change trail. Use{' '}
              <strong className="font-semibold">Print Report</strong> to generate a PDF-ready report for any period.
            </p>
          </div>
        </main>
      </div>

      {/* Hidden Printable Report */}
      <PrintableReport
        printRef={printRef}
        dateLabel={audit.dateLabel}
        summary={audit.summary}
        revenueRows={audit.revenueRows}
        roomTypeBreakdown={audit.roomTypeBreakdown}
        occupancyRows={audit.occupancyRows}
        guestStats={audit.guestStats}
      />

      {/* Modals */}
      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      <BookingDetailModal bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
    </>
  );
}