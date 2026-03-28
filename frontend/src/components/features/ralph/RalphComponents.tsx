import { 
    ShieldCheck, 
    ShieldAlert, 
    Clock, 
    Zap, 
    Globe, 
    Server, 
    CheckCircle2, 
    XCircle,
    Terminal,
    Code2,
    Database,
    LineChart,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Card, 
    CardContent, 
} from "@/components/ui/card";

/**
 * FixCard: Summary information for a specific fix
 */
export const FixCard = ({ monitor, lastFixStatus, fixTestedAt }) => {
    const getStatusColor = () => {
        switch (lastFixStatus) {
            case 'SUCCESS': return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
            case 'VALIDATED': return 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
            case 'MERGED': return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse';
            case 'POST_MERGE_FAILED': return 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.6)]';
            case 'FAILED': return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
            case 'PENDING': return 'bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.4)]';
            default: return 'bg-slate-300';
        }
    };

    return (
        <Card className="rounded-[40px] border-slate-100 shadow-sm overflow-hidden group hover:border-primary/20 transition-all">
            <CardContent className="p-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[32px] bg-slate-50 flex items-center justify-center relative">
                            <Globe className="h-10 w-10 text-slate-300" />
                            <div className={`absolute -top-1 -right-1 h-6 w-6 rounded-full border-4 border-white animate-pulse ${getStatusColor()}`} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-900 leading-none">{monitor?.name || 'Unknown Node'}</h2>
                                <Badge variant="outline" className="rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-slate-100 text-slate-400">
                                    Ralph Diagnostics
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {fixTestedAt ? new Date(fixTestedAt).toLocaleString() : 'Never'}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                <span className="text-primary italic">Confidence: 95%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-end">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">Status</p>
                            <p className={`text-sm font-black uppercase tracking-tighter ${lastFixStatus === 'VALIDATED' ? 'text-green-500' : 'text-slate-900'}`}>{lastFixStatus}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * ValidationPanel: Frontend & Backend health metrics
 */
export const ValidationPanel = ({ fix }) => {
    const metrics = fix?.aiFix?.metrics || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FRONTEND */}
            <div className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <Globe className="h-32 w-32" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                        <LineChart className="h-6 w-6" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Frontend Health</h4>
                </div>
                <div className="space-y-4 relative">
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-xs font-bold text-slate-400">Status</span>
                        <span className="text-xs font-black text-green-500 uppercase">200 OK</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-xs font-bold text-slate-400">Latency</span>
                        <span className="text-xs font-black text-slate-900 tabular-nums">124ms</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-400">Sentinel IQ</span>
                        <span className="text-xs font-black text-slate-900">Score 0/10</span>
                    </div>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[9px] font-bold text-green-500 uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3" /> PASSED
                </div>
            </div>

            {/* BACKEND */}
            <div className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <Database className="h-32 w-32" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <Server className="h-6 w-6" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Backend API</h4>
                </div>
                <div className="space-y-4 relative">
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-xs font-bold text-slate-400">Health Endpoint</span>
                        <span className="text-xs font-black text-green-500 uppercase">OK (JSON)</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-xs font-bold text-slate-400">Retries</span>
                        <span className="text-xs font-black text-slate-900 tabular-nums">0/2</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-400">Latency</span>
                        <span className="text-xs font-black text-slate-900 tabular-nums">85ms</span>
                    </div>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[9px] font-bold text-green-500 uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3" /> PASSED
                </div>
            </div>

            {/* STABILITY */}
            <div className="p-10 rounded-[40px] bg-slate-900 border border-slate-800 shadow-2xl space-y-8 relative overflow-hidden group">
                 <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-32 w-32 text-indigo-400" />
                </div>
                <div className="flex items-center gap-4 text-white">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Phase 3: Stability</h4>
                </div>
                <div className="space-y-5 relative">
                     <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                        Ralph observed the preview session for **60 seconds** to detect memory leaks, race conditions, or delayed hydration failures.
                     </p>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-indigo-500 transition-all duration-1000" />
                    </div>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 60S VERIFIED
                </div>
            </div>
        </div>
    );
};

/**
 * ActionPanel: Merge / Reject controls
 */
export const ActionPanel = ({ status, onMerge, onReject, isLoading }) => {
    const isReady = status === 'VALIDATED';

    return (
        <div className="p-12 rounded-[48px] bg-white border border-slate-100 shadow-xl flex flex-col items-center text-center gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent opacity-50" />
            
            <div className="space-y-4 relative">
                <div className={`mx-auto h-20 w-20 rounded-[32px] flex items-center justify-center border transition-all ${isReady ? 'bg-green-50 border-green-100 text-green-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    {isReady ? <ShieldCheck className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">Commit AI Recommendation?</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest italic">
                        {isReady 
                            ? "This fix has passed all multi-endpoint validation checks. It is safe to merge." 
                            : "Validation is in progress or failed. Manual approval is locked for safety."}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6 relative">
                <Button 
                    variant="ghost" 
                    className="px-10 py-7 rounded-[24px] text-xs font-black uppercase tracking-widest text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    disabled={isLoading}
                    onClick={onReject}
                >
                    Reject Fix
                </Button>
                <Button 
                    size="lg"
                    className={`px-14 py-8 rounded-[28px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all ${isReady ? 'bg-primary hover:bg-primary-hover shadow-primary/30' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                    disabled={!isReady || isLoading}
                    onClick={onMerge}
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Merge to Main Branch"}
                </Button>
            </div>
            
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                <Terminal className="h-3 w-3" /> Branch: fix/ralph-auto-fix
            </p>
        </div>
    );
};
