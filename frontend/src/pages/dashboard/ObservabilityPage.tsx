import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { observabilityApi, type FixSuggestion, type AnalysisResult } from '@/lib/observabilityApi';
import { useProject } from '@/context/ProjectContext';

import TraceSidebar from '@/components/observability/TraceSidebar';
import Timeline from '@/components/observability/Timeline';
import RootCauseCard from '@/components/observability/RootCauseCard';
import AIExplanation from '@/components/observability/AIExplanation';
import ConfirmModal from '@/components/observability/ConfirmModal';

import {
  Activity, Brain, Loader2, Telescope, PanelLeftClose, PanelLeft,
} from 'lucide-react';

export default function ObservabilityPage() {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [modalFix, setModalFix] = useState<FixSuggestion | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { selectedProject } = useProject();
  const queryClient = useQueryClient();

  // Fetch trace timeline
  const {
    data: traceData,
    isLoading: traceLoading,
  } = useQuery({
    queryKey: ['trace', selectedTraceId],
    queryFn: () => observabilityApi.getTrace(selectedTraceId!),
    enabled: !!selectedTraceId,
  });

  // Fetch AI analysis
  const {
    data: analysisData,
    isLoading: analysisLoading,
  } = useQuery({
    queryKey: ['analysis', selectedTraceId],
    queryFn: () => observabilityApi.analyzeTrace(selectedTraceId!),
    enabled: !!selectedTraceId,
    staleTime: 60000,
  });

  const trace = traceData?.data;
  const analysis = analysisData?.data as AnalysisResult | undefined;

  const handleSelectTrace = useCallback((traceId: string) => {
    setSelectedTraceId(traceId);
  }, []);

  const handleApplyFix = useCallback((fix: FixSuggestion) => {
    setModalFix(fix);
  }, []);

  const handleActionComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['trace', selectedTraceId] });
  }, [queryClient, selectedTraceId]);

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-12 -my-2 sm:-my-8 h-[calc(100vh-80px)] flex bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
          >
            <TraceSidebar
              projectId={selectedProject?._id || null}
              selectedTraceId={selectedTraceId}
              onSelectTrace={handleSelectTrace}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/40 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h1 className="text-sm font-semibold text-slate-200">Observability</h1>
            </div>

            {selectedTraceId && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700/50 rounded text-slate-400">
                {selectedTraceId}
              </span>
            )}
          </div>

          {selectedTraceId && trace && (
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>{trace.log_count} events</span>
              <span>•</span>
              <span>{trace.duration_ms}ms</span>
              <span>•</span>
              <span className="capitalize">{trace.environment}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedTraceId ? (
            /* Empty state */
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 border border-slate-700/30 flex items-center justify-center mx-auto mb-4">
                  <Telescope className="w-7 h-7 text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-200 mb-2">
                  Select a Trace
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Choose a trace from the sidebar to view its timeline, root cause analysis,
                  AI-powered explanation, and available actions.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { icon: '📊', label: 'Timeline', desc: 'Event waterfall' },
                    { icon: '🔍', label: 'Root Cause', desc: 'Rule detection' },
                    { icon: '🧠', label: 'AI Analysis', desc: 'Gemini insight' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                      <span className="text-lg">{item.icon}</span>
                      <p className="text-xs font-medium text-slate-300 mt-1">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : traceLoading ? (
            /* Loading state */
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Loading trace data...</p>
              </div>
            </div>
          ) : trace ? (
            /* Trace view */
            <motion.div
              key={selectedTraceId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-6 max-w-4xl mx-auto space-y-6"
            >
              {/* Root Cause Card */}
              <RootCauseCard
                rootCause={trace.root_cause}
                impactLevel={trace.impact_level}
                isDemo={trace.is_demo}
              />

              {/* Two column layout on larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline */}
                <div className="lg:col-span-1">
                  <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm p-5">
                    <Timeline
                      timeline={trace.timeline}
                      durationMs={trace.duration_ms}
                    />
                  </div>
                </div>

                {/* AI + Fixes */}
                <div className="lg:col-span-1">
                  {analysisLoading ? (
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-8 text-center">
                      <Brain className="w-6 h-6 text-violet-400 animate-pulse mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Analyzing with AI...</p>
                    </div>
                  ) : (
                    <AIExplanation
                      aiAnalysis={analysis?.ai_analysis || null}
                      aiAvailable={analysis?.ai_available || false}
                      suggestedFixes={analysis?.suggested_fixes || []}
                      onApplyFix={handleApplyFix}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!modalFix}
        fix={modalFix}
        traceId={selectedTraceId || ''}
        projectId={selectedProject?._id || null}
        onClose={() => setModalFix(null)}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
