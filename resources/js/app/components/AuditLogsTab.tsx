import { useState } from 'react';
import { AuditLogRow } from '../services/auditService';

interface Props {
  logs: AuditLogRow[];
  count: number;
  page: number;
  setPage: (p: number) => void;
  loading: boolean;
  onViewDetail: (log: AuditLogRow) => void;
}

const PAGE_SIZE = 20;

const actionColors: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-800',
  UPDATE: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-blue-100 text-blue-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  APPROVE: 'bg-teal-100 text-teal-800',
  REJECT: 'bg-rose-100 text-rose-800',
  CHECK_IN: 'bg-indigo-100 text-indigo-800',
  CHECK_OUT: 'bg-purple-100 text-purple-800',
};

export default function AuditLogsTab({ logs, count, page, setPage, loading, onViewDetail }: Props) {
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const filtered = logs.filter((l) => {
    const matchAction = !actionFilter || l.action?.toUpperCase().includes(actionFilter.toUpperCase());
    const matchEntity = !entityFilter || l.entity_type?.toLowerCase().includes(entityFilter.toLowerCase());
    return matchAction && matchEntity;
  });

  const totalPages = Math.ceil(count / PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Filter by action (e.g. UPDATE)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
        <input
          placeholder="Filter by entity (e.g. bookings)"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
        <span className="text-sm text-gray-500 self-center">
          Showing {filtered.length} of {count} entries
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">System Audit Trail</h3>
          <p className="text-xs text-gray-500">All tracked changes within the selected period</p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No audit logs found for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Changed By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => {
                  const colorClass = actionColors[log.action?.toUpperCase()] ?? 'bg-gray-100 text-gray-700';
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{log.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 font-medium">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-gray-400 text-xs ml-1">#{log.entity_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.changer_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                        {log.reason ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewDetail(log)}
                          className="text-xs text-teal-600 hover:text-teal-800 font-medium px-2 py-1 rounded-lg hover:bg-teal-50 transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      pageNum === page
                        ? 'bg-teal-700 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
