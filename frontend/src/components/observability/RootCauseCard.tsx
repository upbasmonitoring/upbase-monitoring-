import { motion } from 'framer-motion';
import { type RootCause } from '@/lib/observabilityApi';
import {
  Database, Cloud, Monitor, Server, Shield, Clock, Cpu, Wifi,
  Package, Settings, HelpCircle, Zap,
} from 'lucide-react';

const categoryConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  database:       { icon: Database, color: 'text-red-400', bg: 'bg-red-500/15', label: 'Database' },
  cdn:            { icon: Cloud, color: 'text-orange-400', bg: 'bg-orange-500/15', label: 'CDN / Edge' },
  frontend:       { icon: Monitor, color: 'text-violet-400', bg: 'bg-violet-500/15', label: 'Frontend' },
  backend:        { icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/15', label: 'Backend' },
  authentication: { icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-500/15', label: 'Authentication' },
  timeout:        { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Timeout' },
  memory:         { icon: Cpu, color: 'text-pink-400', bg: 'bg-pink-500/15', label: 'Memory' },
  network:        { icon: Wifi, color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Network' },
  third_party:    { icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-500/15', label: 'Third Party' },
  infrastructure: { icon: Settings, color: 'text-slate-400', bg: 'bg-slate-500/15', label: 'Infrastructure' },
  configuration:  { icon: Settings, color: 'text-teal-400', bg: 'bg-teal-500/15', label: 'Configuration' },
  unknown:        { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-500/15', label: 'Unknown' },
};

const impactStyles: Record<string, { color: string; bg: string; glow: string }> = {
  critical: { color: 'text-red-300', bg: 'bg-red-500/20', glow: 'shadow-red-500/20' },
  high:     { color: 'text-orange-300', bg: 'bg-orange-500/20', glow: 'shadow-orange-500/20' },
  medium:   { color: 'text-yellow-300', bg: 'bg-yellow-500/20', glow: 'shadow-yellow-500/20' },
  low:      { color: 'text-emerald-300', bg: 'bg-emerald-500/20', glow: 'shadow-emerald-500/20' },
};

const confidenceBars: Record<string, number> = { high: 3, medium: 2, low: 1 };

interface Props {
  rootCause: RootCause;
  impactLevel: string;
  isDemo?: boolean;
}

export default function RootCauseCard({ rootCause, impactLevel, isDemo }: Props) {
  const cat = categoryConfig[rootCause.category] || categoryConfig.unknown;
  const impact = impactStyles[impactLevel] || impactStyles.low;
  const Icon = cat.icon;
  const bars = confidenceBars[rootCause.confidence] || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm shadow-xl ${impact.glow}`}
    >
      {/* Glow accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${cat.bg} opacity-60`} />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${cat.bg}`}>
              <Icon className={`w-5 h-5 ${cat.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-200">Root Cause</h3>
                {isDemo && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">
                    TEST DATA
                  </span>
                )}
              </div>
              <p className={`text-xs font-bold uppercase tracking-wider ${cat.color}`}>{cat.label}</p>
            </div>
          </div>

          {/* Impact badge */}
          <div className={`px-3 py-1.5 rounded-full ${impact.bg} border border-slate-700/30`}>
            <div className="flex items-center gap-1.5">
              <Zap className={`w-3 h-3 ${impact.color}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wider ${impact.color}`}>
                {impactLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          {rootCause.description || 'No description available'}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4">
          {rootCause.matched_rule && (
            <span className="text-[10px] font-mono px-2 py-1 bg-slate-700/40 rounded-md text-slate-400">
              rule: {rootCause.matched_rule}
            </span>
          )}

          {/* Confidence bars */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] text-slate-500 mr-1">Confidence</span>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all ${
                  i <= bars
                    ? `h-${i + 2} ${cat.bg.replace('/15', '/60')}`
                    : 'h-2 bg-slate-700/40'
                }`}
                style={{ height: i <= bars ? `${8 + i * 3}px` : '8px' }}
              />
            ))}
            <span className={`text-[10px] font-medium ${cat.color} ml-1`}>
              {rootCause.confidence}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
