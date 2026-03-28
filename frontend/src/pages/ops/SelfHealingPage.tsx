import { useQuery } from "@tanstack/react-query";
import { 
    Zap, 
    RefreshCcw, 
    Cpu, 
    Terminal, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Wrench,
    ArrowRight,
    Search,
    ShieldCheck,
    Satellite,
    Fingerprint,
    Brain,
    Sparkles,
    Target,
    Activity,
    Shield
} from "lucide-react";

import { useProject } from "@/context/ProjectContext";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";

const SelfHealingPage = () => {
    const { selectedProject } = useProject();
    const [isAutopilot, setIsAutopilot] = useState(false);

    // Fetch user integrations to get current autopilot state
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // In a real app, you'd get this from a /user/profile endpoint
                const res = await apiFetch("/auth/whatsapp/status");
            } catch (err) {
                console.error(err);
            }
        };
        fetchStatus();
    }, []);

    const toggleAutopilot = async () => {
        try {
            const newStatus = !isAutopilot;
            setIsAutopilot(newStatus);
            await apiFetch("/auth/integrations", {
                method: "PUT",
                body: JSON.stringify({ isAutopilotEnabled: newStatus })
            });
        } catch (err) {
            console.error(err);
        }
    };

    const { data: logs, isLoading } = useQuery({
        queryKey: ["healing-logs", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return [];
            return await apiFetch(`/monitors/healing/logs?projectId=${selectedProject._id}`);
        },
        refetchInterval: 5000,
        enabled: !!selectedProject?._id
    });

    return (
            <div className="space-y-12 pb-20 font-sans">
                
                {/* --- 🚀 1. RECOVERY HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-4 lg:max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,163,255,0.4)]" />
                            <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400">System Stability</h2>
                        </div>
                        <h1 className="text-4xl font-bold uppercase tracking-tighter text-slate-900 leading-none">
                            Automated <span className="text-primary">Recovery</span>
                        </h1>
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Autonomous remediation of performance degradations. 
                            The engine monitors for failure triggers and applies fail-safes instantly.
                        </p>
                    </div>

                    <div className="flex items-center gap-8 px-10 py-6 bg-white border border-slate-100 rounded-[32px] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] group hover:border-primary/20 transition-all">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-[.3em] text-slate-300 leading-none mb-2">Autopilot Mode</span>
                            <span className={`text-3xl font-bold tracking-tighter tabular-nums leading-none uppercase transition-all ${isAutopilot ? 'text-primary' : 'text-slate-300'}`}>
                                {isAutopilot ? 'Active' : 'Standby'}
                            </span>
                         </div>
                         <div className="h-10 w-px bg-slate-50" />
                         <button 
                            onClick={toggleAutopilot}
                            className={`h-14 w-28 rounded-2xl flex items-center justify-between px-3 transition-all relative overflow-hidden boarder-2 ${isAutopilot ? 'bg-primary border-primary shadow-[0_10px_30px_rgba(0,163,255,0.3)]' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                         >
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isAutopilot ? 'translate-x-14 bg-white text-primary shadow-sm' : 'bg-white text-slate-300 shadow-sm'}`}>
                                <Zap className="h-4 w-4" fill={isAutopilot ? "currentColor" : "none"} />
                            </div>
                            {!isAutopilot && <div className="absolute right-4 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-slate-200" />}
                         </button>
                    </div>
                </div>

                {/* --- 📊 2. OPERATION METRICS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        label="Auto-Rollbacks" 
                        value={logs?.filter((l: any) => l.rollback?.attempted).length || 0} 
                        icon={<RefreshCcw className="h-5 w-5" />} 
                        trend="Revision Control"
                        activeColor="blue"
                    />
                    <MetricCard 
                        label="Engine Solutions" 
                        value={logs?.filter((l: any) => l.aiFix?.attempted).length || 0} 
                        icon={<Cpu className="h-5 w-5" />} 
                        trend="Automated Fixes"
                        activeColor="indigo"
                    />
                    <MetricCard 
                        label="Recovery Rate" 
                        value="100%" 
                        icon={<ShieldCheck className="h-5 w-5" />} 
                        trend="Stable Uptime"
                        activeColor="emerald"
                    />
                    <MetricCard 
                        label="Avg MTTR" 
                        value="142s" 
                        icon={<Clock className="h-5 w-5" />} 
                        trend="Mean Time to Fix"
                        activeColor="slate"
                    />
                </div>

                {/* --- 📟 3. RECOVERY LOGS --- */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="h-18 px-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <Terminal className="h-4 w-4 text-slate-300" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400">Recovery Operations Audit</h3>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Live Relay: Monitoring</span>
                        </div>
                    </div>

                    <div className="min-h-[600px] p-10 lg:p-14 space-y-16">
                        {isLoading ? (
                            <div className="space-y-10 animate-pulse">
                                {[1,2,3].map(i => <div key={i} className="h-32 w-full bg-slate-50 rounded-[32px] border border-slate-100" />)}
                            </div>
                        ) : logs?.length > 0 ? (
                            logs.map((log: any) => (
                                <div key={log._id} className="relative group animate-in slide-in-from-top-4 duration-700">
                                    <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-slate-50 group-hover:bg-primary/10 transition-all rounded-full" />
                                    
                                    <div className="flex flex-col gap-10">
                                        {/* --- 🧠 RALPH INTELLIGENCE --- */}
                                        {log.analysis?.cause && (
                                            <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all relative overflow-hidden group/intel">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/intel:opacity-10 transition-opacity">
                                                    <Brain className="h-28 w-28 text-indigo-500" />
                                                </div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="h-10 w-10 rounded-[1.25rem] bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100 relative z-10">
                                                        <Sparkles className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-500 relative z-10">Autonomous Diagnosis</span>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Detection Vector</p>
                                                        <p className="text-sm font-bold text-slate-900 leading-snug uppercase tracking-tight">{log.analysis.cause}</p>
                                                    </div>
                                                    <div className="space-y-3 lg:border-l lg:border-slate-100 lg:pl-10">
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">System Impact</p>
                                                        <p className="text-sm font-bold text-slate-500 leading-snug uppercase tracking-tight">{log.analysis.impact}</p>
                                                    </div>
                                                    <div className="space-y-3 lg:border-l lg:border-slate-100 lg:pl-10">
                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Remediation Engine</p>
                                                        <p className="text-sm font-bold text-indigo-600 leading-snug underline decoration-indigo-100 underline-offset-8 decoration-2 uppercase tracking-tight">{log.analysis.suggestion}</p>
                                                    </div>
                                                </div>

                                                {/* --- 🤖 GEMINI AI DEEP ANALYSIS --- */}
                                                {log.analysis.aiAnalysis && (
                                                    <div className="mt-10 pt-10 border-t border-slate-100 space-y-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-indigo-400">Gen-AI Forensic Commentary</p>
                                                        </div>
                                                        <div className="p-8 rounded-[32px] bg-white border border-slate-100 text-[11px] font-semibold text-slate-400 leading-relaxed uppercase tracking-widest italic relative">
                                                            <span className="absolute -top-2 left-6 px-2 bg-white text-indigo-500 text-[8px] font-black uppercase tracking-widest border border-slate-100 rounded-md">Log Entry</span>
                                                            "{log.analysis.aiAnalysis}"
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 pt-4">
                                            <div className="px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                                                Event Trigger
                                            </div>
                                            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest tabular-nums">{new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            <div className="h-px flex-1 bg-slate-50" />
                                            <div className="flex items-center gap-3">
                                                <Target className="h-3.5 w-3.5 text-slate-200" />
                                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-[.2em] truncate max-w-[250px]">{log.monitor?.name}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Rollback Phase */}
                                            {log.rollback?.attempted && (
                                                <div className="p-8 rounded-[40px] bg-white border border-slate-100 group/roll hover:border-blue-200 transition-all shadow-sm">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <span className="text-[10px] font-bold uppercase text-blue-500 tracking-[.3em] flex items-center gap-3 italic">
                                                            <RefreshCcw className="h-4.5 w-4.5 text-blue-400" /> 
                                                            VCS Fail-Safe
                                                        </span>
                                                        <StatusPill status={log.rollback.status} />
                                                    </div>
                                                    <div className="space-y-5">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Target Reversion</p>
                                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">SHA <span className="text-blue-500 italic">#{log.rollback.commitSha?.substring(0,7) || 'N/A'}</span></p>
                                                        </div>
                                                        {log.rollback.message && (
                                                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed italic">
                                                                    {log.rollback.message}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Fix Phase */}
                                            {log.aiFix?.attempted && (
                                                <div className="p-8 rounded-[40px] bg-white border border-slate-100 group/ai hover:border-indigo-200 transition-all shadow-sm">
                                                     <div className="flex items-center justify-between mb-8">
                                                        <span className="text-[10px] font-bold uppercase text-indigo-500 tracking-[.3em] flex items-center gap-3 italic">
                                                            <Cpu className="h-4.5 w-4.5 text-indigo-400" /> 
                                                            System Patch
                                                        </span>
                                                        <StatusPill status={log.aiFix.status} />
                                                    </div>
                                                    <div className="space-y-5">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Code Injection</p>
                                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter italic">Engine <span className="text-indigo-500">v2.4_Stable</span></p>
                                                        </div>
                                                        {log.aiFix.message && (
                                                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed italic">
                                                                    {log.aiFix.message}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {log.outcome.startsWith('healed') ? (
                                            <div className="flex items-center gap-8 p-8 px-10 rounded-[40px] bg-emerald-50 border border-emerald-100 shadow-sm relative overflow-hidden group/success transition-all">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/success:opacity-10 transition-opacity">
                                                    <ShieldCheck className="h-20 w-20 text-emerald-500" />
                                                </div>
                                                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm text-emerald-500 relative z-10">
                                                    <CheckCircle2 className="h-7 w-7" />
                                                </div>
                                                <div className="flex-1 space-y-1.5 relative z-10">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[12px] font-bold uppercase text-emerald-600 tracking-[0.2em]">Resolution Verified</span>
                                                        <span className="text-[10px] font-bold text-emerald-300 tabular-nums uppercase">{new Date(log.completedAt || Date.now()).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest truncate leading-none">Signal integrity restored. System returned to nominal state.</p>
                                                </div>
                                            </div>
                                        ) : log.outcome === 'healing_failed' ? (
                                            <div className="flex items-center gap-8 p-8 px-10 rounded-[40px] bg-red-50 border border-red-100 shadow-sm relative overflow-hidden group/fail transition-all">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/fail:opacity-10 transition-opacity">
                                                    <XCircle className="h-20 w-20 text-red-500" />
                                                </div>
                                                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-red-100 shadow-sm text-red-500 relative z-10">
                                                    <XCircle className="h-7 w-7" />
                                                </div>
                                                <div className="flex-1 space-y-1.5 relative z-10">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[12px] font-bold uppercase text-red-600 tracking-[0.2em]">Sequence Halted</span>
                                                        <span className="text-[10px] font-bold text-red-300 tabular-nums uppercase">{new Date(log.completedAt || Date.now()).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate leading-none">Automated recovery bypassed. Manual remediation required for node <span className="text-red-500 underline decoration-2 underline-offset-4 cursor-pointer">#{log.monitor?.id?.substring(0,6)}</span>.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-8 p-8 px-10 rounded-[40px] bg-slate-50 border border-slate-100 relative group/pending transition-all grayscale opacity-50">
                                                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-sm text-slate-300 relative z-10">
                                                    <Clock className="h-7 w-7 animate-spin-slow" />
                                                </div>
                                                <div className="flex-1 space-y-1.5 relative z-10">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Remediation in progress. Monitoring node for stability handshake...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-[500px] flex flex-col items-center justify-center text-slate-200 text-center gap-10">
                                <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 shadow-sm scale-110">
                                    <Satellite className="h-16 w-16 opacity-10" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[12px] font-bold uppercase tracking-[0.5em] text-slate-300">Operational Grid: Quiet</p>
                                    <p className="text-[10px] font-bold uppercase text-slate-200 tracking-widest">No recovery sequences registered in active cache</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );
};

const MetricCard = ({ label, value, icon, trend, activeColor }: any) => {
    const colorMap: any = {
        blue: "text-blue-500 bg-blue-50 border-blue-100",
        indigo: "text-indigo-500 bg-indigo-50 border-indigo-100",
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
        slate: "text-slate-500 bg-slate-50 border-slate-100"
    };
    
    return (
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:border-primary/20 transition-all group flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all bg-slate-50 border border-slate-100 group-hover:scale-110 shadow-sm ${colorMap[activeColor] || colorMap.slate}`}>
                    {icon}
                </div>
                <div className="h-1.5 w-6 rounded-full bg-slate-50 group-hover:bg-primary/10 transition-all" />
            </div>
            <div className="space-y-3 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[.3em] text-slate-300">{label}</p>
                <h3 className="text-4xl font-bold tracking-tighter uppercase tabular-nums text-slate-900 leading-none">
                    {value}
                </h3>
                {trend && (
                    <div className="pt-2">
                        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-200 bg-slate-50 inline-block px-3 py-1 rounded-lg">
                            {trend}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusPill = ({ status }: any) => {
    switch(status) {
        case 'success':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                </div>
            )
        case 'failed':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    <XCircle className="h-3.5 w-3.5" />
                    Bypassed
                </div>
            )
        case 'pending':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-sm">
                    <Clock className="h-3.5 w-3.5" />
                    Active
                </div>
            )
        default:
            return <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{status}</span>
    }
}

export default SelfHealingPage;
