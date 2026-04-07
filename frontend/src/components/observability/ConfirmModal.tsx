import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type FixSuggestion, type ActionResult } from '@/lib/observabilityApi';
import { observabilityApi } from '@/lib/observabilityApi';
import {
  AlertTriangle, Check, X, Loader2, ShieldAlert,
  ThumbsUp, ThumbsDown, Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  fix: FixSuggestion | null;
  traceId: string;
  projectId: string | null;
  onClose: () => void;
  onActionComplete: () => void;
}

type Stage = 'confirm' | 'executing' | 'result' | 'feedback';

export default function ConfirmModal({ isOpen, fix, traceId, projectId, onClose, onActionComplete }: Props) {
  const [stage, setStage] = useState<Stage>('confirm');
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleConfirm = async () => {
    if (!fix?.action_id) return;
    setStage('executing');
    setError(null);

    try {
      // Step 1: Create action
      const { data: pending } = await observabilityApi.createAction({
        action_id: fix.action_id,
        trace_id: traceId,
        project_id: fix.context?.project_id || projectId || undefined,
        environment: fix.context?.environment,
      });

      // Step 2: Confirm and execute
      const { data: result } = await observabilityApi.confirmAction(pending.id, true);
      setActionResult(result);
      setStage('result');
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Action failed');
      setStage('result');
    }
  };

  const handleCancel = () => {
    resetAndClose();
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!actionResult?.id) return;
    try {
      await observabilityApi.submitFeedback(actionResult.id, helpful);
      setFeedbackSent(true);
      setTimeout(() => resetAndClose(), 1500);
    } catch {
      setFeedbackSent(true);
      setTimeout(() => resetAndClose(), 1500);
    }
  };

  const resetAndClose = () => {
    setStage('confirm');
    setActionResult(null);
    setError(null);
    setFeedbackSent(false);
    onClose();
  };

  if (!isOpen || !fix) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={stage === 'confirm' ? handleCancel : undefined}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl overflow-hidden"
        >
          {/* Top accent */}
          <div className={`h-1 w-full ${
            fix.risk === 'high' ? 'bg-red-500' : fix.risk === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
          }`} />

          <div className="p-6">
            {/* Confirm Stage */}
            {stage === 'confirm' && (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-xl ${
                    fix.risk === 'high' ? 'bg-red-500/15' : fix.risk === 'medium' ? 'bg-yellow-500/15' : 'bg-cyan-500/15'
                  }`}>
                    {fix.risk === 'high' ? (
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    ) : (
                      <Zap className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-200">Confirm Action</h3>
                    <p className="text-xs text-slate-500 mt-0.5">This action will be logged and tracked.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 mb-4">
                  <h4 className="text-sm font-medium text-slate-200 mb-1">{fix.action}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{fix.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                      fix.risk === 'high' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                      fix.risk === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      {fix.risk} risk
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{fix.action_id}</span>
                  </div>
                </div>

                {fix.risk === 'high' && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-300">High-risk action. Please confirm carefully.</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-sm text-cyan-300 font-medium hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Execute
                  </button>
                </div>
              </>
            )}

            {/* Executing Stage */}
            {stage === 'executing' && (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-300">Executing action...</p>
                <p className="text-xs text-slate-500 mt-1">{fix.action}</p>
              </div>
            )}

            {/* Result Stage */}
            {stage === 'result' && (
              <>
                <div className="py-4 text-center">
                  {error ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3">
                        <X className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-200 mb-1">Action Failed</h3>
                      <p className="text-xs text-red-400">{error}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-200 mb-1">Action Completed</h3>
                      <p className="text-xs text-slate-400">
                        {actionResult?.result?.message || 'Success'}
                      </p>
                      {actionResult?.duration_ms !== undefined && (
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          Completed in {actionResult.duration_ms}ms
                        </p>
                      )}
                    </>
                  )}
                </div>

                {!error && !feedbackSent && (
                  <div className="pt-3 border-t border-slate-700/30">
                    <p className="text-xs text-slate-500 text-center mb-3">Was this action helpful?</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => handleFeedback(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs hover:bg-slate-700 transition-colors"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> Not helpful
                      </button>
                    </div>
                  </div>
                )}

                {feedbackSent && (
                  <p className="text-xs text-emerald-400 text-center mt-3">Thanks for your feedback!</p>
                )}

                <button
                  onClick={resetAndClose}
                  className="w-full mt-4 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
