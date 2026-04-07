import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type TimelineEntry } from '@/lib/observabilityApi';
import { ChevronDown, Copy, Check } from 'lucide-react';

const severityStyles = {
  critical: { line: 'bg-red-500', dot: 'bg-red-500 shadow-red-500/50', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  error:    { line: 'bg-orange-500', dot: 'bg-orange-500 shadow-orange-500/50', text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  warning:  { line: 'bg-yellow-500', dot: 'bg-yellow-500 shadow-yellow-500/50', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  info:     { line: 'bg-emerald-500', dot: 'bg-emerald-500 shadow-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
  frontend: { icon: '🌐', label: 'Frontend', color: 'text-violet-400' },
  backend:  { icon: '⚙️', label: 'Backend', color: 'text-cyan-400' },
  system:   { icon: '🗄️', label: 'System', color: 'text-amber-400' },
};

interface Props {
  timeline: TimelineEntry[];
  durationMs: number;
}

export default function Timeline({ timeline, durationMs }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyMetadata = (idx: number, meta: any) => {
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">No timeline data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Event Timeline
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {timeline.length} events • {durationMs}ms span
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {timeline.map((entry, idx) => {
          const sev = severityStyles[entry.severity as keyof typeof severityStyles] || severityStyles.info;
          const type = typeConfig[entry.type] || typeConfig.backend;
          const isLast = idx === timeline.length - 1;
          const isExpanded = expandedIdx === idx;
          const ts = new Date(entry.timestamp);
          const timeStr = ts.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const msStr = `.${String(ts.getMilliseconds()).padStart(3, '0')}`;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative flex gap-4"
            >
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center pt-1">
                <div className={`w-3 h-3 rounded-full ${sev.dot} shadow-lg z-10 ring-4 ring-slate-900`} />
                {!isLast && <div className={`w-0.5 flex-1 ${sev.line} opacity-30`} />}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all hover:bg-slate-800/40 ${
                    isExpanded ? `${sev.bg}` : 'bg-slate-800/20 border-slate-700/30'
                  }`}
                >
                  {/* Top row: time + type + severity */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-500">
                      {timeStr}<span className="text-slate-600">{msStr}</span>
                    </span>
                    <span className="text-xs" title={type.label}>{type.icon}</span>
                    <span className={`text-[10px] font-medium ${type.color}`}>{type.label}</span>
                    {entry.source && (
                      <span className="text-[10px] text-slate-600 font-mono">/{entry.source}</span>
                    )}
                    {entry.service && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400">
                        {entry.service}
                      </span>
                    )}
                    <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider ${sev.text}`}>
                      {entry.severity}
                    </span>
                    {entry.metadata && (
                      <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {entry.message}
                  </p>
                </button>

                {/* Expanded metadata */}
                <AnimatePresence>
                  {isExpanded && entry.metadata && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 ml-1 p-3 bg-slate-900/80 border border-slate-700/30 rounded-lg relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyMetadata(idx, entry.metadata); }}
                          className="absolute top-2 right-2 p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                          title="Copy JSON"
                        >
                          {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <pre className="text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
