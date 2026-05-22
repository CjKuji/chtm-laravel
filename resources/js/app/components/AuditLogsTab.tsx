import { useState } from 'react';
import { AuditLogRow } from '@/app/services/audit.service';

interface Props {
  logs: AuditLogRow[];
  count: number;
  page: number;
  setPage: (p: number) => void;
  loading: boolean;
  onViewDetail: (log: AuditLogRow) => void;
}

const PAGE_SIZE = 20;

type ActionStyle = { badge: string; icon: string };

const actionStyles: Record<string, ActionStyle> = {
  INSERT:    { badge: 'bg-green-50 text-green-800 border-green-200',   icon: 'ti-plus'        },
  UPDATE:    { badge: 'bg-amber-50 text-amber-800 border-amber-200',   icon: 'ti-edit'        },
  DELETE:    { badge: 'bg-red-50 text-red-800 border-red-200',         icon: 'ti-trash'       },
  LOGIN:     { badge: 'bg-blue-50 text-blue-800 border-blue-200',      icon: 'ti-login'       },
  LOGOUT:    { badge: 'bg-gray-100 text-gray-700 border-gray-200',     icon: 'ti-logout'      },
  APPROVE:   { badge: 'bg-teal-50 text-teal-800 border-teal-200',      icon: 'ti-check'       },
  REJECT:    { badge: 'bg-rose-50 text-rose-800 border-rose-200',      icon: 'ti-x'           },
  CHECK_IN:  { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',icon: 'ti-door-enter'  },
  CHECK_OUT: { badge: 'bg-purple-50 text-purple-800 border-purple-200',icon: 'ti-door-exit'   },
};

const fallbackStyle: ActionStyle = {
  badge: 'bg-gray-100 text-gray-600 border-gray-200',
  icon: 'ti-activity',
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
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]" aria-hidden="true" />
          <input
            placeholder="Filter by action…"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent w-48"
          />
        </div>
        <div className="relative">
          <i className="ti ti-filter absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]" aria-hidden="true" />
          <input
            placeholder="Filter by entity…"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent w-48"
          />
        </div>
        <span className="text-xs text-gray-400 ml-1">
          {filtered.length} of {count} entries
        </span>
      </div>

      {/* Table card */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">System Audit Trail</h3>
            <p className="text-xs text-gray-400 mt-0.5">All tracked changes within the selected period</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
            <i className="ti ti-list-details text-gray-400 text-[14px]" aria-hidden="true" />
            <span className="text-xs text-gray-500 font-medium">{count} total</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <i className="ti ti-clipboard-x text-[36px] text-gray-300" aria-hidden="true" />
            <p className="text-sm">No audit logs found for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['ID', 'Action', 'Entity', 'Changed By', 'Reason', 'Timestamp', ''].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap
                        ${h === '' || h === 'Timestamp' || h === 'ID' ? 'text-left' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => {
                  const style = actionStyles[log.action?.toUpperCase()] ?? fallbackStyle;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                        #{log.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${style.badge}`}>
                          <i className={`ti ${style.icon} text-[11px]`} aria-hidden="true" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 font-medium">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-gray-400 text-xs ml-1">#{log.entity_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{log.changer_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                        {log.reason ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewDetail(log)}
                          className="inline-flex items-center gap-1 text-xs text-green-800 hover:text-green-900 font-medium px-2 py-1 rounded-md hover:bg-green-50 transition"
                        >
                          <i className="ti ti-eye text-[12px]" aria-hidden="true" />
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
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
              >
                <i className="ti ti-chevron-left text-[12px]" aria-hidden="true" />
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition font-medium
                      ${pageNum === page
                        ? 'bg-green-800 text-white'
                        : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
              >
                Next
                <i className="ti ti-chevron-right text-[12px]" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}