import { useState, useEffect } from "react";
import { 
    ShieldCheck, 
    Terminal, 
    Code2, 
    AlertCircle,
    ChevronRight,
    Search,
    Bug,
    Zap,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { apiFetch } from "@/lib/api";
import { FixCard, ValidationPanel, ActionPanel } from "@/components/features/ralph/RalphComponents";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * DiffViewer: A professional-grade code comparison view
 */
const DiffViewer = ({ original, fixed }) => {
    if (!original && !fixed) return <div className="p-8 text-slate-500 italic">No code changes available for this fix.</div>;
    
    // Simple heuristic to show the change
    const originalLines = original?.split('\n') || [];
    const fixedLines = fixed?.split('\n') || [];

    return (
        <div className="rounded-[40px] bg-slate-900 border border-slate-800 shadow-2xl p-1 relative group overflow-hidden">
            <div className="max-h-[500px] overflow-auto custom-scrollbar bg-slate-950 rounded-[38px] font-mono p-6">
                <div className="flex flex-col gap-0.5">
                    {fixedLines.map((line, idx) => {
                        const isAdded = !originalLines.includes(line);
                        return (
                            <div key={idx} className={`flex items-start gap-4 px-4 py-0.5 rounded-sm transition-colors ${isAdded ? 'bg-green-500/10 border-l-2 border-green-500' : 'opacity-80'}`}>
                                <span className="w-8 shrink-0 text-[10px] tabular-nums text-slate-600 select-none">{idx + 1}</span>
                                <span className={`text-[11px] leading-relaxed break-all ${isAdded ? 'text-green-400 font-bold' : 'text-slate-300'}`}>
                                    {isAdded ? '+ ' : '  '}
                                    {line}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Legend */}
            <div className="absolute top-6 right-8 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Added</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Ralph Diagnostics Dashboard: The human-in-the-loop recovery center.
 */
const RalphDiagnosticsPage = () => {
    const { selectedProject } = useProject();
    const [monitorsWithFixes, setMonitorsWithFixes] = useState([]);
    const [selectedMonitor, setSelectedMonitor] = useState(null);
    const [activeFix, setActiveFix] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Fetch monitors that have an active fix pending
    useEffect(() => {
        const fetchMonitors = async () => {
            if (!selectedProject?._id) return;
            setIsLoading(true);
            try {
                const data = await apiFetch(`/monitors?projectId=${selectedProject._id}`);
                // Filter for monitors with PENDING or VALIDATED status
                const withFixes = data.filter(m => m.lastFixStatus === 'PENDING' || m.lastFixStatus === 'VALIDATED');
                setMonitorsWithFixes(withFixes);
                if (withFixes.length > 0 && !selectedMonitor) {
                    setSelectedMonitor(withFixes[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMonitors();
    }, [selectedProject]);

    // Fetch specific fix details when a monitor is selected
    useEffect(() => {
        const fetchFixDetails = async () => {
            if (!selectedMonitor?._id) return;
            try {
                const fix = await apiFetch(`/fixes/${selectedMonitor._id}`);
                setActiveFix(fix);
            } catch (err) {
                console.error("Fix fetch error:", err);
                setActiveFix(null);
            }
        };
        fetchFixDetails();
    }, [selectedMonitor]);

    const [showMergeConfirm, setShowMergeConfirm] = useState(false);

    const handleMerge = async () => {
        if (!activeFix?._id) return;
        setIsActionLoading(true);
        try {
            await apiFetch(`/fixes/${activeFix._id}/merge`, { method: 'POST' });
            toast.success("Fix merged to main branch. Starting production verification...");
            
            // Immediately start post-merge validation
            await triggerPostMergeValidation();
        } catch (err) {
            toast.error(`Merge failed: ${err.message}`);
            setIsActionLoading(false);
        }
    };

    const triggerPostMergeValidation = async () => {
        try {
            const res = await apiFetch(`/fixes/${activeFix._id}/post-merge-validate`, { method: 'POST' });
            if (res.success) {
                toast.success("Production URLs verified! System is stable.");
            } else {
                toast.error(res.message);
            }
            // Refresh to show stable status
            window.location.reload();
        } catch (err) {
            toast.error(`Post-merge validation failed: ${err.message}. Rollback might have triggered.`);
            window.location.reload();
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!activeFix?._id) return;
        setIsActionLoading(true);
        try {
            await apiFetch(`/fixes/${activeFix._id}/reject`, { method: 'POST' });
            toast.info("Fix has been rejected and ignored.");
            window.location.reload();
        } catch (err) {
            toast.error(`Operation failed: ${err.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
            <div className="space-y-12 pb-20">
                {/* --- 🧠 HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm text-primary">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Diagnostic Hub</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter uppercase text-foreground leading-none">
                            Up-base <span className="text-primary italic">Diagnostics</span>
                        </h1>
                        <p className="text-[11px] sm:text-sm font-medium text-muted-foreground/60 max-w-xl">
                            Review and approve AI-generated code fixes. Up-base has validated these suggestions across frontend and backend endpoints for safety.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-6 bg-card border border-border rounded-[32px] shadow-sm flex items-center gap-6">
                            <div className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground/40">
                                <Bug className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-1 font-sans">Active Fixes</p>
                                <p className="text-2xl font-black text-foreground leading-none tabular-nums">{monitorsWithFixes.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {monitorsWithFixes.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Sidebar: Fix Selection */}
                        <div className="lg:col-span-4 space-y-6">
                             <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/40 flex items-center gap-3 px-2">
                                <Search className="h-4 w-4 text-primary" />
                                Selection Queue
                            </h3>
                            <div className="space-y-4">
                                {monitorsWithFixes.map(m => (
                                    <button 
                                        key={m._id}
                                        onClick={() => setSelectedMonitor(m)}
                                        className={`w-full text-left p-6 rounded-[32px] border transition-all flex items-center justify-between group ${selectedMonitor?._id === m._id ? 'bg-card border-primary/20 shadow-lg' : 'bg-secondary/50 border-border opacity-60 hover:opacity-100'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${selectedMonitor?._id === m._id ? 'bg-primary/10 text-primary' : 'bg-card text-muted-foreground/20'}`}>
                                                <Terminal className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{m.name}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{m.lastFixStatus}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 transition-transform ${selectedMonitor?._id === m._id ? 'text-primary translate-x-1' : 'text-muted-foreground/20'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Analysis Area */}
                        <div className="lg:col-span-8 space-y-12">
                            {selectedMonitor && (
                                <>
                                    <FixCard 
                                        monitor={selectedMonitor} 
                                        lastFixStatus={selectedMonitor.lastFixStatus} 
                                        fixTestedAt={activeFix?.startedAt || selectedMonitor.fixTestedAt} 
                                    />

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/40 flex items-center gap-3 px-2">
                                            <Code2 className="h-4 w-4 text-primary" />
                                            AI Generation: {activeFix?.aiFix?.filePath || 'Decoding...'}
                                        </h3>
                                        <DiffViewer 
                                            original={activeFix?.aiFix?.originalCode} 
                                            fixed={activeFix?.aiFix?.fixedCode} 
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/40 flex items-center gap-3 px-2">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            Multi-Endpoint Validation
                                        </h3>
                                        <ValidationPanel fix={activeFix} />
                                    </div>

                                    <ActionPanel 
                                        status={selectedMonitor.lastFixStatus} 
                                        onMerge={() => setShowMergeConfirm(true)}
                                        onReject={handleReject}
                                        isLoading={isActionLoading}
                                    />

                                    {/* Confirmation Dialog */}
                                    <AlertDialog open={showMergeConfirm} onOpenChange={setShowMergeConfirm}>
                                        <AlertDialogContent className="rounded-[32px] border-border bg-card p-10 shadow-2xl">
                                            <AlertDialogHeader className="space-y-4">
                                                <AlertDialogTitle className="text-xl sm:text-2xl font-black text-foreground leading-none">Confirm Production Merge</AlertDialogTitle>
                                                <AlertDialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground/40">
                                                    This will execute a **hard merge** from your fix branch directly into your primary production branch. 
                                                    Up-base will perform post-deployment verification immediately after.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-8 gap-4">
                                                <AlertDialogCancel className="rounded-2xl border-border bg-secondary text-[10px] font-bold uppercase tracking-widest px-8">Cancel</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => {
                                                        setShowMergeConfirm(false);
                                                        handleMerge();
                                                    }}
                                                    className="rounded-2xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-8 hover:bg-primary/90 shadow-lg shadow-primary/20"
                                                >
                                                    Merge & Verify
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="min-h-[500px] rounded-[60px] bg-card border border-border flex flex-col items-center justify-center gap-10 text-center p-12 relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 right-0 p-20 opacity-[0.02] group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-64 w-64" />
                        </div>
                        <div className="space-y-6 relative">
                            <div className="mx-auto h-24 w-24 rounded-[40px] bg-secondary border border-border flex items-center justify-center text-muted-foreground/20 group-hover:text-primary transition-all">
                                <Zap className="h-12 w-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">No Pending Diagnostics</h3>
                                <p className="text-sm font-medium text-muted-foreground/40">All systems are operational or being autonomously monitored.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default RalphDiagnosticsPage;
