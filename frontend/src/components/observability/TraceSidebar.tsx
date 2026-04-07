import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { observabilityApi, type TraceSummary } from '@/lib/observabilityApi';
import {
  AlertTriangle, AlertCircle, AlertOctagon, Info, Filter,
  Clock, Layers, ChevronDown, Search, RefreshCw,
} from 'lucide-react';

const severityConfig = {
  critical: { icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', dot: 'bg-red-500' },
  error:    { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  warning:  { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', dot: 'bg-yellow-500' },
  info:     { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', dot: 'bg-blue-500' },
};

const typeIcons: Record<string, string> = {
  frontend: '🌐', backend: '⚙️', system: '🗄️',
};

interface Props {
  selectedTraceId: string | null;
  projectId: string | null;
  onSelectTrace: (traceId: string) => void;
}

export default function TraceSidebar({ selectedTraceId, projectId, onSelectTrace }: Props) {
  const [severity, setSeverity] = useState<string>('error');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['trace-errors', severity, projectId],
    queryFn: () => observabilityApi.getErrors({ severity, limit: 40, project_id: projectId || undefined }),
    refetchInterval: 30000,
    enabled: !!projectId,
  });

  const traces = data?.data || [];

  const filtered = search
    ? traces.filter(t =>
        t.root_cause?.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.trace_id.toLowerCase().includes(search.toLowerCase()) ||
        t.root_cause?.category?.toLowerCase().includes(search.toLowerCase())
      )
    : traces;

  const formatTime = useCallback((ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/60 border-r border-slate-700/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Traces</h2>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search traces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Filter className="w-3 h-3" />
          Filters
          <ChevronDown className={`w-3 h-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['warning', 'error', 'critical'].map((sev) => {
                  const cfg = severityConfig[sev as keyof typeof severityConfig];
                  return (
                    <button
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        severity === sev
                          ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trace list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-800/50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No traces found</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map((trace) => {
              const sev = trace.max_severity as keyof typeof severityConfig;
              const cfg = severityConfig[sev] || severityConfig.info;
              const Icon = cfg.icon;
              const isActive = selectedTraceId === trace.trace_id;

              return (
                <motion.button
                  key={trace.trace_id}
                  onClick={() => onSelectTrace(trace.trace_id)}
                  className={`w-full text-left p-3 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 p-1 rounded-md ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                          {trace.impact_level}
                        </span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {trace.root_cause?.category}
                        </span>
                        {trace.is_demo && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">
                            DEMO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {trace.root_cause?.description || 'Analyzing...'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex gap-0.5">
                          {trace.types_involved?.map(t => (
                            <span key={t} className="text-[10px]" title={t}>{typeIcons[t]}</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(trace.last_seen)}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {trace.log_count} logs
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="p-3 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-500 text-center">
          {filtered.length} trace{filtered.length !== 1 ? 's' : ''} • Auto-refresh 30s
        </p>
      </div>
    </div>
  );
}
