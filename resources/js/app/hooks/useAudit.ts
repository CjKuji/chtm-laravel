import { useState, useEffect, useCallback } from 'react';
import {
  AuditPeriod, AuditSummary, RevenueRow, RoomTypeBreakdown,
  OccupancyRow, GuestStats, AuditLogRow,
  getDateRange, fetchRevenueSummary, fetchMonthlyRevenue,
  fetchQuarterlyRevenue, fetchAnnualRevenue, fetchRoomTypeBreakdown,
  fetchRoomOccupancy, fetchGuestStats, fetchAuditLogs,
} from '@/app/services/audit.service';

export type AuditTab = 'sales' | 'occupancy' | 'guests' | 'logs';

export interface UseAuditReturn {
  period: AuditPeriod;
  setPeriod: (p: AuditPeriod) => void;
  year: number;
  setYear: (y: number) => void;
  month: number;
  setMonth: (m: number) => void;
  quarter: number;
  setQuarter: (q: number) => void;
  activeTab: AuditTab;
  setActiveTab: (t: AuditTab) => void;
  summary: AuditSummary | null;
  revenueRows: RevenueRow[];
  roomTypeBreakdown: RoomTypeBreakdown[];
  occupancyRows: OccupancyRow[];
  guestStats: GuestStats | null;
  auditLogs: AuditLogRow[];
  auditLogsCount: number;
  auditLogsPage: number;
  setAuditLogsPage: (p: number) => void;
  dateLabel: string;
  dateRange: { from: string; to: string };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAudit(): UseAuditReturn {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  const [period, setPeriod] = useState<AuditPeriod>('monthly');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [quarter, setQuarter] = useState(currentQuarter);
  const [activeTab, setActiveTab] = useState<AuditTab>('sales');
  const [auditLogsPage, setAuditLogsPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [revenueRows, setRevenueRows] = useState<RevenueRow[]>([]);
  const [roomTypeBreakdown, setRoomTypeBreakdown] = useState<RoomTypeBreakdown[]>([]);
  const [occupancyRows, setOccupancyRows] = useState<OccupancyRow[]>([]);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLogsCount, setAuditLogsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { from, to, label } = getDateRange(period, year, month, quarter);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, roomTypes, occupancy, guests, logsData] = await Promise.all([
        fetchRevenueSummary(from, to),
        fetchRoomTypeBreakdown(from, to),
        fetchRoomOccupancy(from, to),
        fetchGuestStats(from, to),
        fetchAuditLogs(from, to, auditLogsPage),
      ]);
      setSummary(sumData);
      setRoomTypeBreakdown(roomTypes);
      setOccupancyRows(occupancy);
      setGuestStats(guests);
      setAuditLogs(logsData.data);
      setAuditLogsCount(logsData.count);

      if (period === 'monthly') {
        setRevenueRows(await fetchMonthlyRevenue(year));
      } else if (period === 'quarterly') {
        setRevenueRows(await fetchQuarterlyRevenue(year));
      } else if (period === 'annual') {
        setRevenueRows(await fetchAnnualRevenue(currentYear - 4, currentYear));
      } else {
        const rows = await fetchMonthlyRevenue(year);
        const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
        setRevenueRows(rows.filter((r) => r.period === monthName));
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [period, year, month, quarter, from, to, auditLogsPage, refreshKey]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return {
    period, setPeriod, year, setYear, month, setMonth, quarter, setQuarter,
    activeTab, setActiveTab,
    summary, revenueRows, roomTypeBreakdown, occupancyRows, guestStats,
    auditLogs, auditLogsCount, auditLogsPage, setAuditLogsPage,
    dateLabel: label, dateRange: { from, to },
    loading, error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}