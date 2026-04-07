import { motion } from 'framer-motion';
import { type AIAnalysis, type FixSuggestion } from '@/lib/observabilityApi';
import {
  Brain, Sparkles, Lightbulb, ShieldCheck, ShieldAlert,
  Wrench, Bot, Zap, ChevronRight,
} from 'lucide-react';

const riskColors: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
};

interface Props {
  aiAnalysis: AIAnalysis | null;
  aiAvailable: boolean;
  suggestedFixes: FixSuggestion[];
  onApplyFix: (fix: FixSuggestion) => void;
}

export default function AIExplanation({ aiAnalysis, aiAvailable, suggestedFixes, onApplyFix }: Props) {
  return (
    <div className="space-y-4">
      {/* AI Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-violet-500/15">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">AI Analysis</h3>
            {aiAvailable ? (
              <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Gemini
              </span>
            ) : (
              <span className="ml-auto text-[10px] px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full flex items-center gap-1">
                <Bot className="w-2.5 h-2.5" /> Rule-based
              </span>
            )}
          </div>

          {aiAnalysis ? (
            <div className="space-y-3">
              {/* Human explanation */}
              <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                <p className="text-sm text-slate-200 leading-relaxed">
                  💡 {aiAnalysis.explanation}
                </p>
              </div>

              {/* Technical summary */}
              <div className="p-3 bg-slate-800/40 rounded-xl">
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  {aiAnalysis.technical_summary}
                </p>
              </div>

              {/* Validation + Confidence */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {aiAnalysis.root_cause_validated ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className={`text-[11px] ${aiAnalysis.root_cause_validated ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {aiAnalysis.root_cause_validated ? 'Root cause validated' : 'AI suggests different cause'}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Confidence</span>
                  <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(aiAnalysis.confidence || 0) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((aiAnalysis.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>

              {/* Prevention tips */}
              {aiAnalysis.prevention_tips && aiAnalysis.prevention_tips.length > 0 && (
                <div className="pt-2 border-t border-slate-700/30">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Prevention Tips
                  </h4>
                  <ul className="space-y-1">
                    {aiAnalysis.prevention_tips.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-slate-600 mt-0.5">›</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500">
                AI analysis unavailable. Showing rule-based suggestions below.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Fix Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm"
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-cyan-500/15">
              <Wrench className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Suggested Fixes</h3>
            <span className="ml-auto text-[10px] text-slate-500">{suggestedFixes.length} available</span>
          </div>

          <div className="space-y-2">
            {suggestedFixes.map((fix, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{fix.action}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${riskColors[fix.risk]}`}>
                        {fix.risk} risk
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-400">
                        {fix.source === 'ai' ? '🤖 AI' : '📋 Rule'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{fix.description}</p>
                  </div>

                  {fix.type === 'automated' && fix.action_id && (
                    <button
                      onClick={() => onApplyFix(fix)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium border border-cyan-500/20 hover:bg-cyan-500/25 hover:border-cyan-500/40 transition-all group-hover:shadow-lg group-hover:shadow-cyan-500/10"
                    >
                      <Zap className="w-3 h-3" />
                      Apply
                      <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
