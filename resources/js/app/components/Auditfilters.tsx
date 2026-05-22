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
  { id: 'daily',     label: 'By Month'   },
  { id: 'monthly',   label: 'Full Year'  },
  { id: 'quarterly', label: 'Quarterly'  },
  { id: 'annual',    label: 'Multi-Year' },
];

export default function AuditFilters({
  period, setPeriod, year, setYear, month, setMonth,
  quarter, setQuarter, loading, onRefresh, onPrint, dateLabel,
}: AuditFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
      <div className="flex flex-wrap items-end gap-4">

        {/* Period toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
            View Mode
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-2 text-xs font-medium transition-all whitespace-nowrap
                  ${period === p.id
                    ? 'bg-green-800 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
            Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Month (daily drill-down) */}
        {period === 'daily' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        )}

        {/* Quarter */}
        {period === 'quarterly' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              Quarter
            </label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200">
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuarter(q)}
                  className={`px-4 py-2 text-xs font-medium transition-all
                    ${quarter === q
                      ? 'bg-green-800 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Active period label */}
        <div className="flex flex-col gap-1.5 items-end">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
            Active Period
          </label>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <i className="ti ti-calendar text-green-700 text-[14px]" aria-hidden="true" />
            <span className="text-sm font-medium text-green-800">{dateLabel}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 self-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className={`ti ti-refresh text-[14px] ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-800 hover:bg-green-900 text-white rounded-lg text-sm font-medium transition"
          >
            <i className="ti ti-printer text-[14px]" aria-hidden="true" />
            Print Report
          </button>
        </div>

      </div>
    </div>
  );
}