import React, { useState, useEffect, useCallback } from 'react';
import { DiagnosticsChat } from '@/components/features/ai/DiagnosticsChat';
import { DocumentationModal } from '@/components/features/ai/DocumentationModal';
import { Brain, Sparkles, LucideMonitor, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Monitor {
  _id: string;
  name: string;
  url: string;
}

const AIPage: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  // Holds a query injected from the doc modal
  const [injectedQuery, setInjectedQuery] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonitors = async () => {
      try {
        const response = await apiFetch('/monitors');
        if (response && response.length > 0) {
          setMonitors(response);
          setSelectedMonitor(response[0]);
        }
      } catch (err) {
        console.error('Failed to fetch monitors for AI chat:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitors();
  }, []);

  // Called when user picks an example query from the doc modal
  const handleQuerySelect = useCallback((query: string) => {
    setInjectedQuery(query);
  }, []);

  // Called by DiagnosticsChat once it has consumed the injected query
  const handleQueryConsumed = useCallback(() => {
    setInjectedQuery(null);
  }, []);

  return (
      <div className="space-y-8">
        {/* Modal Overlay */}
        <DocumentationModal 
          isOpen={showDocs} 
          onClose={() => setShowDocs(false)}
          onQuerySelect={handleQuerySelect}
        />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm shrink-0">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">AI Observability</h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 whitespace-nowrap">Powered by MCP Core Engine</span>
                <div className="hidden sm:block h-1 w-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[8px] sm:text-[9px] font-black text-emerald-600 uppercase tracking-tight">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monitor Selector for Context */}
          {!loading && monitors.length > 0 && (
            <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
                <LucideMonitor className="w-3.5 h-3.5 text-muted-foreground/40 ml-2" />
                <select 
                    id="monitor-select"
                    name="monitorSelect"
                    value={selectedMonitor?._id || ''} 
                    onChange={(e) => {
                        const m = monitors.find(x => x._id === e.target.value);
                        if (m) setSelectedMonitor(m);
                    }}
                    className="bg-transparent text-xs font-bold text-muted-foreground/60 focus:outline-none border-none pr-8 py-1"
                >
                    {monitors.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                </select>
            </div>
          )}
        </div>

        {/* Chat Interface Container */}
        <div className="relative group">
            {/* Simple decorative glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative">
                <DiagnosticsChat 
                    monitorId={selectedMonitor?._id} 
                    targetUrl={selectedMonitor?.url}
                    injectedQuery={injectedQuery}
                    onInjectedQueryConsumed={handleQueryConsumed}
                />
            </div>
        </div>

        {/* Helper Footer */}
        <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-10 w-10 rounded-xl bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                    <Brain className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-tight">Up-base Intelligence Agent</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none mt-1">SRE-Level Observability Engine</p>
                </div>
            </div>
            
            <button 
                onClick={() => setShowDocs(true)}
                className="w-full sm:w-auto group relative px-6 py-2.5 bg-secondary/50 hover:bg-foreground border border-border hover:border-foreground rounded-xl transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-foreground/10 flex items-center justify-center gap-3"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                <LucideMonitor className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[10px] font-black text-muted-foreground/60 group-hover:text-background uppercase tracking-widest transition-colors">
                    View Documentation
                </span>
            </button>
        </div>
      </div>
  );
};

export default AIPage;
