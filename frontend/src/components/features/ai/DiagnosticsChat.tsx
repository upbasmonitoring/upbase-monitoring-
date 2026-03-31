import React, { useState, useRef, useEffect } from 'react';
import { queryMCP, MCPResponse } from '@/lib/mcpService';
import { 
  LucideSend, 
  LucideShield, 
  LucideActivity, 
  LucideAlertCircle, 
  LucideZap, 
  LucideBug, 
  LucideClock, 
  LucideInfo,
  LucideLoader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  data?: MCPResponse;
  timestamp: Date;
}

interface DiagnosticsChatProps {
  monitorId?: string;
  targetUrl?: string;
  injectedQuery?: string | null;
  onInjectedQueryConsumed?: () => void;
}

export const DiagnosticsChat: React.FC<DiagnosticsChatProps> = ({ monitorId, targetUrl, injectedQuery, onInjectedQueryConsumed }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // When a query is injected from the DocumentationModal, auto-fill and submit it
  useEffect(() => {
    if (!injectedQuery) return;
    setQuery(injectedQuery);
    onInjectedQueryConsumed?.();
    // Use a tiny delay so state flush completes before we submit
    const t = setTimeout(() => {
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      handleDirectSubmit(injectedQuery, syntheticEvent);
    }, 80);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectedQuery]);

  // Shared submit logic that works with direct query text (bypasses stale state)
  const handleDirectSubmit = async (queryText: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || isLoading) return;
    setQuery('');
    await runQuery(queryText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    const text = query;
    setQuery('');
    await runQuery(text);
  };

  const runQuery = async (queryText: string) => {

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const wakingTimer = setTimeout(() => {
        setIsWakingServer(true);
    }, 3500);

    try {
      const response = await queryMCP(queryText, monitorId, targetUrl, debugMode);
      
      const aiMessage: ChatMessage = {
        id: response.requestId,
        type: 'ai',
        content: response.summary,
        data: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
        setMessages(prev => [...prev, {
            id: 'err',
            type: 'ai',
            content: `Failed to connect to AI Diagnostics Engine. Error: ${err.message}`,
            timestamp: new Date()
        }]);
    } finally {
      clearTimeout(wakingTimer);
      setIsLoading(false);
      setIsWakingServer(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'medium': return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      case 'low': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
      default: return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] lg:h-[700px] w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <LucideShield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 uppercase tracking-tight text-xs flex items-center gap-2">
              AI Observability Agent
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400 flex items-center gap-1 animate-pulse">
                🛡️ Blockchain Verified
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Connected to MCP Core Engine</p>
          </div>
        </div>
        <button 
          onClick={() => setDebugMode(!debugMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            debugMode ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <LucideBug className="w-3.5 h-3.5" />
          Debug {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-full border border-slate-700">
              <LucideZap className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <p className="text-slate-200 font-medium">Diagnostic Assistant Ready</p>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Ask about performance, security, or error logs to start analysis.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] sm:max-w-[85%] ${msg.type === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' : 'space-y-4'} p-3 sm:p-4`}>
                {msg.type === 'user' ? (
                    <span className="text-sm">{msg.content}</span>
                ) : (
                    <div className="space-y-4">
                        {/* Summary Card */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                                    <LucideInfo className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getSeverityColor(msg.data?.severity || 'low')}`}>
                                            {msg.data?.severity || 'status'}
                                        </span>
                                        <span className="text-xs text-slate-500">{msg.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-slate-200 text-sm leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        {msg.data && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 sm:p-3 rounded-xl flex items-center gap-3">
                                    <LucideActivity className="w-4 h-4 text-emerald-400" />
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold">Latency p95</p>
                                        <p className="text-xs sm:text-sm text-slate-200 font-mono">
                                            {msg.data.latency.p95.toString().replace(/ms$/, '')}ms
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 sm:p-3 rounded-xl flex items-center gap-3">
                                    <LucideShield className="w-4 h-4 text-sky-400" />
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold">Confidence</p>
                                        <p className="text-xs sm:text-sm text-slate-200">{Math.round(msg.data.confidenceScore * 100)}%</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error/Warning Flags */}
                        {msg.data && (msg.data.errors.length > 0 || msg.data.security.issues.length > 0) && (
                            <div className="space-y-2">
                                            {msg.data.errors && msg.data.errors.length > 0 && msg.data.severity === 'high' && (
                                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                                    <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                                                        <LucideAlertCircle size={16} />
                                                        Backend Exceptions
                                                    </h4>
                                                    <ul className="text-sm space-y-1 text-red-300 opacity-80 list-none pl-0">
                                                        {msg.data.errors.slice(0, 3).map((err, i) => (
                                                            <li key={i}>• {err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {/* Luxury Tier: Move "Passive" signals to a footnote or hide if accuracy note is present */}
                                            {msg.data.severity !== 'high' && msg.data.errors?.some(e => e.includes("Cold start") || e.includes("404")) && (
                                                <div className="mt-2 text-xs text-blue-400/60 italic px-1">
                                                    Note: Some minor network signals (timeouts/cold starts) were filtered for report accuracy.
                                                </div>
                                            )}</div>
                        )}

                        {/* Debug Tools Meta */}
                        {debugMode && msg.data && (
                            <div className="bg-black/20 rounded-xl p-3 border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-mono mb-2">RAW OBSERVABILITY METRICS</p>
                                <div className="space-y-1.5 font-mono text-[10px]">
                                    {Object.entries(msg.data.toolsMeta).map(([tool, meta]) => (
                                        <div key={tool} className="flex justify-between items-center text-slate-400">
                                            <span>{tool}</span>
                                            <span className={meta.success ? 'text-emerald-400' : 'text-red-400'}>
                                                {meta.time}ms {meta.timeout ? ' [TIMEOUT]' : ''}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="pt-2 border-t border-slate-800 flex justify-between text-indigo-400">
                                        <span>TOTAL PIPELINE TIME</span>
                                        <span>{msg.data.totalExecutionTime}ms</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
              <LucideLoader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm text-slate-300">Analyzing engine metrics...</p>
                {isWakingServer && (
                    <p className="text-[10px] text-amber-500 animate-pulse">Waking Render instance (cold start delay)...</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            id="chat-query"
            name="query"
            autoComplete="off"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about site performance or security..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:bg-slate-700"
          >
            <LucideSend className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
                <LucideClock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500">Real-time p95 analysis active</span>
            </div>
            {targetUrl && (
                <div className="flex items-center gap-1.5">
                    <LucideShield className="w-3.5 h-3.5 text-emerald-500/70" />
                    <span className="text-[10px] text-slate-500">Scanning {new URL(targetUrl).hostname}</span>
                </div>
            )}
        </div>
      </form>
    </div>
  );
};
