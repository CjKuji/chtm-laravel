import { AuditPeriod } from '@/app/services/audit.service';

interface AuditFiltersProps {
  period: AuditPeriod;
  setPeriod: (p: AuditPeriod) => void;
  year: number;
  setYear: (y: number) => void;
  month: number;
  setMonth: (m: number) => void;
  quarter: number;
  setQuarter: (q: number) => void;
  loading: boolean;
  onRefresh: () => void;
  onPrint: () => void;
  dateLabel: string;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i + 1);

const PERIODS: { id: AuditPeriod; label: string }[] = [
  { id: 'daily',     label: 'By Month' },
  { id: 'monthly',   label: 'Full Year' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'annual',    label: 'Multi-Year' },
];

export default function AuditFilters({
  period, setPeriod, year, setYear, month, setMonth,
  quarter, setQuarter, loading, onRefresh, onPrint, dateLabel,
}: AuditFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">

        {/* Period toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">View Mode</label>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 divide-x divide-gray-200">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap
                  ${period === p.id ? 'bg-teal-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Month (daily drill-down) */}
        {period === 'daily' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        )}

        {/* Quarter */}
        {period === 'quarterly' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Quarter</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 divide-x divide-gray-200">
              {[1,2,3,4].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuarter(q)}
                  className={`px-4 py-2 text-xs font-semibold transition-all
                    ${quarter === q ? 'bg-teal-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Active label */}
        <div className="flex flex-col gap-1.5 items-end">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Period</label>
          <span className="px-4 py-2 bg-teal-50 text-teal-800 rounded-xl text-sm font-bold border border-teal-200">
            📊 {dateLabel}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 self-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
          >
            <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
            Refresh
          </button>
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            🖨️ Print Report
          </button>
        </div>
      </div>
    </div>
  );
}