import { useQuery } from "@tanstack/react-query";
import { 
    Brain, 
    Sparkles, 
    Activity, 
    ShieldAlert, 
    TrendingDown, 
    ChevronRight,
    Terminal,
    Search,
    Target,
    Zap,
    Cpu,
    Satellite,
    Fingerprint
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";

const RalphIntelligencePage = () => {
    const { selectedProject } = useProject();

    const { data: insights, isLoading } = useQuery({
        queryKey: ["global-intelligence", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return [];
            return await apiFetch(`/monitors/intelligence/feed?projectId=${selectedProject._id}`);
        },
        enabled: !!selectedProject?._id
    });

    return (
            <div className="space-y-12 pb-20">
                {/* --- 🧠 HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100/50 shadow-sm">
                            <Brain className="h-4 w-4 text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 leading-none">AI Analytics Core</span>
                        </div>
                        <h1 className="text-5xl font-bold tracking-tighter uppercase text-slate-900 leading-none">
                            Ralph <span className="text-primary italic">Intelligence</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-400 max-w-xl">
                            The analytical hub of Upbase. Ralph scans every failure, correlates deployments, and provides Gemini-powered deep root cause analysis (RCA) across your entire fleet.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm flex items-center gap-6">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1 font-sans">Patterns Detected</p>
                                <p className="text-2xl font-black text-slate-900 leading-none tabular-nums">{insights?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 📊 SIGNAL STREAM --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center justify-between px-2">
                             <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400 flex items-center gap-3">
                                <Terminal className="h-4 w-4 text-primary" />
                                Live Intelligence Stream
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[8px] font-bold uppercase text-slate-300 tracking-widest italic font-sans leading-none">Handshake Stable</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="h-[400px] bg-white border border-slate-100 rounded-[40px] flex items-center justify-center gap-6">
                                <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Decoding Signal...</span>
                            </div>
                        ) : insights?.length > 0 ? (
                            <div className="space-y-6">
                                {insights.map((log: any) => (
                                    <div key={log._id} className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm hover:border-primary/20 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                            <Satellite className="h-24 w-24 text-primary" />
                                        </div>

                                        <div className="flex flex-col gap-8 relative">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-[24px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 group-hover:text-primary transition-colors">
                                                        <Fingerprint className="h-8 w-8" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.monitor?.name}</span>
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                        </div>
                                                        <h4 className="text-lg font-bold text-slate-900 leading-none">Cause: {log.analysis?.cause || 'External Outage'}</h4>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <Link to={`/dashboard/monitors/${log.monitor?._id}`} className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary/20 hover:bg-white transition-all flex items-center gap-2">
                                                        Open Node <ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* AI DEEP ANALYSIS BLOCK */}
                                            {log.analysis?.aiAnalysis && (
                                                <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 text-[11px] font-medium text-slate-500 leading-relaxed italic relative">
                                                    <div className="absolute -top-3 left-6 px-2 bg-indigo-500 text-white rounded text-[8px] font-black uppercase tracking-widest">Gemini Deep Analysis</div>
                                                    "{log.analysis.aiAnalysis}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[400px] bg-white border border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-8 group">
                                <div className="h-20 w-20 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                     <Sparkles className="h-10 w-10 text-slate-200 group-hover:text-primary transition-all animate-slow-pulse" />
                                </div>
                                <div className="text-center space-y-3">
                                    <p className="text-[12px] font-bold uppercase tracking-[.5em] text-slate-900 leading-none italic">Clear Skies</p>
                                    <p className="text-[10px] font-bold uppercase text-slate-300 tracking-widest">No critical anomalies pending resolution</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-12">
                         <div className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400 flex items-center gap-3">
                                <Target className="h-5 w-5 text-primary" />
                                Engine Overview
                            </h3>
                            <div className="p-10 rounded-[40px] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                                    <Zap className="h-32 w-32 text-indigo-400" />
                                </div>
                                <div className="relative space-y-8">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Cpu className="h-7 w-7" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-lg font-bold text-white leading-tight uppercase tracking-tight italic">Ralph Pilot Pro Active</p>
                                        <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                                            Rule-based logic is currently monitoring 4 patterns: Recent Deployments, Latency Spikes, Server 500s, and Authentication Failures.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</span>
                                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Optimized</span>
                                        </div>
                                         <div className="flex flex-col text-right">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence</span>
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic">88% (AVG)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
    );
};

export default RalphIntelligencePage;
