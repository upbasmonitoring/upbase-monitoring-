import React, { useEffect } from 'react';
import { LucideX, LucideSparkles, LucideTerminal, LucideCheckCircle2, LucideBrain } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuerySelect?: (query: string) => void;
}

const EXAMPLE_QUERIES = [
  "Is my site slow?",
  "Is my site secure?",
  "Are there backend errors?",
  "Give full system analysis"
];

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose, onQuerySelect }) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleQueryClick = (query: string) => {
    onQuerySelect?.(query);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white border border-slate-100 rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-6">
            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
              <LucideBrain className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter leading-none">AI Assistant <span className="text-indigo-500">Guide</span></h2>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[.3em] mt-2">Enterprise Observability Protocol</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center hover:bg-white border border-transparent hover:border-slate-200 text-slate-300 hover:text-slate-900 rounded-xl transition-all shadow-none hover:shadow-sm"
          >
            <LucideX className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          
          {/* Section 1: Capabilities */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-indigo-500 text-[10px] font-bold uppercase tracking-[.3em] px-2">
              <LucideSparkles className="w-4 h-4" />
              Intelligence Capabilities
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Latency Analysis", desc: "Monitors p50/p95 tail-latency in real-time." },
                { title: "Stability Audit", desc: "Detects intermittent backend connection resets." },
                { title: "Security Scanner", desc: "Validates header integrity (CSP, HSTS)." },
                { title: "Actionable Insights", desc: "Provides SRE-tier remediation steps." }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-100/50 rounded-3xl flex items-start gap-4 hover:border-indigo-100 transition-colors group">
                  <div className="h-6 w-6 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:border-indigo-200 transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 group-hover:bg-indigo-500 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed uppercase tracking-wider">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Clickable Example Queries */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-500 text-[10px] font-bold uppercase tracking-[.3em] px-2">
              <LucideTerminal className="w-4 h-4" />
              Example Questions <span className="text-slate-300 normal-case tracking-normal font-medium">— click to run</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {EXAMPLE_QUERIES.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleQueryClick(query)}
                  className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-50/30 active:scale-[.99] transition-all cursor-pointer flex items-center justify-between group text-left w-full"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none group-hover:text-indigo-600 transition-colors">"{query}"</span>
                  <span className="flex items-center gap-2 text-[9px] uppercase font-black text-indigo-400 group-hover:text-indigo-600 tracking-widest transition-colors">
                    Run Query <LucideTerminal className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center pt-2">
              Clicking a query will inject it directly into the AI chat input
            </p>
          </section>

          {/* Section 3: Professional Features */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-amber-500 text-[10px] font-bold uppercase tracking-[.2em] px-2">
              <LucideCheckCircle2 className="w-4 h-4" />
              System Attributes
            </div>
            <ul className="grid grid-cols-2 gap-x-12 gap-y-4 px-4">
              {[
                "Real-time monitoring",
                "SRE-level insights",
                "AI-based diagnosis",
                "Debug mode available",
                "Context-aware logic",
                "Actionable alerts"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                  {text}
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4: Pro Tips */}
          <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px] space-y-4 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <LucideBrain className="h-24 w-24 text-indigo-500" />
             </div>
             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[.4em]">Expert Protocol</p>
             <p className="text-[11px] text-slate-500 leading-relaxed font-semibold uppercase tracking-widest relative z-10">
               Toggle <span className="text-indigo-600 font-black">"Debug Mode"</span> in the chat header to see raw telemetry execution times and payload sources for every diagnostic query.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-[0_15px_30px_-5px_rgba(79,70,229,0.3)]"
          >
            Acknowledge System Protocol
          </button>
        </div>
      </div>

    </div>
  );
};
