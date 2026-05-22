import { useState } from 'react';
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

const TABS: { id: AuditTab; label: string; icon: string }[] = [
  { id: 'sales', label: 'Sales & Revenue', icon: '💰' },
  { id: 'occupancy', label: 'Room Occupancy', icon: '🏠' },
  { id: 'guests', label: 'Guest Statistics', icon: '👥' },
  { id: 'logs', label: 'Audit Logs', icon: '📋' },
];

export default function AuditPage() {
  const { collapsed } = useSidebar();
  const audit = useAudit();
  const { printRef, handlePrint } = usePrint();

  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  return (
    <>
      <Sidebar activeMenu="audit" />

      <div
        className={`min-h-screen bg-gray-50 transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                📊 Audit & Reports
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Financial audit, occupancy, guest analytics and system audit trail
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
          {/* Error Banner */}
          {audit.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              ⚠️ {audit.error}
              <button
                onClick={audit.refresh}
                className="ml-auto underline text-red-600 hover:text-red-800"
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

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => audit.setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2
                    ${audit.activeTab === tab.id
                      ? 'border-teal-600 text-teal-700 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5">
              {audit.activeTab === 'sales' && (
                <SalesTab
                  rows={audit.revenueRows}
                  roomTypes={audit.roomTypeBreakdown}
                  loading={audit.loading}
                />
              )}
              {audit.activeTab === 'occupancy' && (
                <OccupancyTab
                  rows={audit.occupancyRows}
                  loading={audit.loading}
                />
              )}
              {audit.activeTab === 'guests' && (
                <GuestsTab
                  stats={audit.guestStats}
                  loading={audit.loading}
                />
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

          {/* Hotel Audit Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
            <strong>📌 Audit Guide:</strong> "Sales & Revenue" tracks all completed stays (checked-out status).
            "Room Occupancy" shows which rooms generated the most revenue. "Guest Statistics" covers
            demographic data from all bookings in the period. "Audit Logs" is the full system change trail
            (who changed what and when). Use the <strong>Print Report</strong> button to generate a printable PDF-ready report for any period.
          </div>
        </div>
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
      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
      <BookingDetailModal
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
      />
    </>
  );
}