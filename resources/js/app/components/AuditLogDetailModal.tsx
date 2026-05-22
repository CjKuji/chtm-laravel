import { AuditLogRow } from '@/app/services/audit.service';

interface Props {
  log: AuditLogRow | null;
  onClose: () => void;
}

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

function JsonBlock({ value }: { value: any }) {
  if (!value) return <span className="text-gray-400 italic text-sm">—</span>;
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-auto max-h-48 text-gray-700 whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AuditLogDetailModal({ log, onClose }: Props) {
  if (!log) return null;

  const colorClass = actionColors[log.action?.toUpperCase()] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Audit Log Detail</h2>
              <p className="text-xs text-gray-500">Log ID #{log.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Meta Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Action</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                {log.action}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Entity</p>
              <p className="text-sm font-semibold text-gray-800">
                {log.entity_type} #{log.entity_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Changed By</p>
              <p className="text-sm font-semibold text-gray-800">{log.changer_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Timestamp</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {log.reason && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason / Notes</p>
              <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                {log.reason}
              </p>
            </div>
          )}

          {/* Old vs New */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Previous Value
              </p>
              <JsonBlock value={log.old_value} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                New Value
              </p>
              <JsonBlock value={log.new_value} />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-700 text-white rounded-xl text-sm font-medium hover:bg-teal-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
