import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { 
    Clock, CheckCircle2, Activity, History as HistoryIcon, Zap, Skull, 
    Terminal, ShieldAlert, Satellite, Fingerprint, Search, Target, Bell 
} from "lucide-react";



import { useProject } from "@/context/ProjectContext";

const getUser = () => {
    return JSON.parse(localStorage.getItem("user") || "null");
};

const AlertsPage = () => {
    const user = getUser();
    const { selectedProject } = useProject();


    const { data: activeAlerts, isLoading: activeLoading } = useQuery({
        queryKey: ["active-alerts", selectedProject?._id],
        queryFn: async () => {
            return await apiFetch(`/monitors/alerts/active?projectId=${selectedProject?._id}`);
        },
        enabled: !!user && !!selectedProject?._id, // Run only when authenticated and project is selected
        refetchInterval: 5000, // ✅ Fresh alerts every 5s
        retry: false 
    });

    const { data: alertHistory, isLoading: historyLoading } = useQuery({
        queryKey: ["alert-history", selectedProject?._id],
        queryFn: async () => {
            return await apiFetch(`/monitors/alerts/history?projectId=${selectedProject?._id}`);
        },
        enabled: !!user && !!selectedProject?._id, // Run only when authenticated and project is selected
        refetchInterval: 10000, // ✅ History refresh every 10s
        retry: false
    });

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
                <ShieldAlert className="h-16 w-16 text-muted-foreground/20" />
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground uppercase tracking-tighter">Security Protocol Required</h2>
                    <p className="text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">Please authenticate to access the Incident Control Center.</p>
                </div>
                <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-8 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:shadow-lg transition-all"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
            <div className="space-y-12 pb-20 font-sans">
                {/* --- 🛰️ 1. INCIDENT HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <ShieldAlert className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-primary">Intelligence Hub</h2>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-tighter text-foreground leading-none">
                            Alert <span className="text-primary">Control</span> Center
                        </h1>
                        <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest max-w-lg leading-relaxed">
                            Centralized forensic visibility into all service signal degradations and node status.
                        </p>
                    </div>

                    <div className="flex items-center gap-5 px-5 sm:px-10 py-4 sm:py-6 bg-card border border-border rounded-2xl sm:rounded-[32px] shadow-sm group hover:border-primary/20 transition-all">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 leading-none mb-2">Active Signal Drop</span>
                            <span className={`text-2xl sm:text-3xl font-bold tracking-tighter tabular-nums leading-none uppercase ${activeAlerts?.length > 0 ? 'text-red-500' : 'text-foreground'}`}>
                                {activeAlerts?.length || 0} SEVERE
                            </span>
                         </div>
                         <div className="h-10 w-px bg-border" />
                         <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-secondary border border-border flex items-center justify-center group-hover:bg-primary/5 transition-all text-muted-foreground/40 group-hover:text-primary">
                            <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                         </div>
                    </div>
                </div>

                {/* --- 🚨 2. INCIDENT MATRIX --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* Active Alerts Column */}
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/40 flex items-center gap-3 px-2">
                            <Fingerprint className="h-4 w-4 text-primary" />
                            Active Signal Traces
                        </h3>
                        
                        <div className="space-y-6 min-h-[400px]">
                            {activeAlerts?.length > 0 ? activeAlerts.map((alert: any) => (
                                <div key={alert._id} className="bg-card p-6 sm:p-8 rounded-2xl sm:rounded-[40px] border border-border shadow-sm hover:border-red-500/20 transition-all group relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full opacity-60 ${
                                        alert.type === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'
                                    }`} />
                                    
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold uppercase tracking-tighter text-foreground group-hover:text-red-500 transition-colors">{alert.monitor?.name}</h3>
                                                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                                                    alert.type === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'
                                                }`} />
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                                {alert.monitor?.url?.replace('https://', '').replace('http://', '')}
                                            </p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-bold tracking-widest uppercase border ${
                                            alert.type === 'DEGRADED' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                            {alert.type === 'DEGRADED' ? 'Performance Drop' : 'Signal Severed'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10 pt-8 border-t border-secondary/50">
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 flex items-center gap-2 leading-none mb-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                Incident Duration
                                            </p>
                                            <p className="text-sm font-bold uppercase tracking-tighter tabular-nums text-foreground">
                                                {formatDuration(alert.monitor?.failureStartedAt)}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 flex items-center gap-2 leading-none mb-1">
                                                <Satellite className="h-3.5 w-3.5" />
                                                Uplink Status
                                            </p>
                                            <p className={`text-sm font-bold uppercase tracking-tighter ${
                                                alert.type === 'DEGRADED' ? 'text-amber-500' : 'text-red-500'
                                            }`}>{alert.type === 'DEGRADED' ? 'Degraded Node' : 'Node Down'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-secondary/50">
                                        <button className="w-full h-14 bg-secondary/50 hover:bg-red-500/10 border border-border hover:border-red-500/20 text-muted-foreground/40 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-sm">
                                            Initiate Recovery Handshake
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-[450px] border-2 border-dashed border-border rounded-[50px] bg-card flex flex-col items-center justify-center text-center gap-10 group hover:border-primary/20 transition-all px-12 shadow-sm">
                                    <div className="h-24 w-24 rounded-3xl bg-secondary border border-border flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-all text-muted-foreground/20 shadow-sm relative">
                                         <div className="absolute inset-0 bg-primary/5 rounded-3xl animate-ping opacity-0 group-hover:opacity-100 duration-1000" />
                                         <Bell className="h-10 w-10 opacity-30 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[.5em] text-muted-foreground/40">Alert Engine Pending</p>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground/20 tracking-widest max-w-[320px] leading-relaxed mx-auto">
                                                🚨 Alerts system is not configured yet. We are calibrating intelligent alert detection for your system.
                                            </p>
                                            <div className="flex items-center justify-center gap-2">
                                                 <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-pulse" />
                                                 <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-pulse delay-150" />
                                                 <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-pulse delay-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alert History Column */}
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/40 flex items-center gap-3 px-2">
                            <HistoryIcon className="h-4 w-4 text-primary" />
                            Archived Signal Ledger
                        </h3>

                        <div className="bg-card rounded-[40px] border border-border shadow-sm h-[680px] flex flex-col overflow-hidden">
                            <div className="h-14 px-6 sm:px-10 border-b border-secondary/50 flex items-center justify-between bg-card text-muted-foreground/40">
                                 <span className="text-[10px] font-bold uppercase tracking-widest hidden xs:block">Handshake Integrity: Verified</span>
                                 <span className="text-[10px] font-bold uppercase tracking-widest block xs:hidden">Verified</span>
                                 <div className="flex items-center gap-2">
                                     <div className="h-1.5 w-1.5 rounded-full bg-border" />
                                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Past 20 Events</span>
                                 </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-4 sm:space-y-5 custom-scrollbar">
                                {alertHistory?.map((log: any) => (
                                    <div key={log._id} className="flex gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-card border border-border hover:border-primary/20 hover:shadow-sm transition-all group/item">
                                        <div className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                                            log.type === 'DOWN' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                                            log.type === 'DEGRADED' || log.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                                            log.type === 'RECOVERY' || log.type === 'UP' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                            'bg-primary/5 border-primary/10 text-primary'
                                        }`}>
                                            {log.type === 'DOWN' ? <Skull className="h-5 w-5 sm:h-6 sm:w-6" /> : 
                                             log.type === 'DEGRADED' ? <Activity className="h-5 w-5 sm:h-6 sm:w-6" /> : 
                                             log.type === 'RECOVERY' ? <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /> :
                                             <Zap className="h-5 w-5 sm:h-6 sm:w-6" />}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm font-bold uppercase text-foreground truncate group-hover/item:text-primary transition-colors">{log.monitor?.name || 'System Alert'}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest tabular-nums">{new Date(log.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-muted-foreground/60 line-clamp-1 uppercase tracking-tight">{log.message}</p>
                                            <div className="flex items-center gap-4 pt-1">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                                    log.type === 'DOWN' ? 'text-red-500' : 
                                                    log.type === 'DEGRADED' ? 'text-amber-500' : 
                                                    log.type === 'RECOVERY' ? 'text-emerald-500' :
                                                    'text-primary'
                                                }`}>Signal {log.type}</span>
                                                <div className="h-1 w-1 rounded-full bg-border" />
                                                <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">{log.severity?.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {alertHistory?.length === 0 && (
                                     <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 gap-6">
                                        <Target className="h-16 w-16 opacity-10" />
                                        <span className="text-[10px] font-bold uppercase tracking-[.4em] opacity-40">No Forensic Records Found</span>
                                     </div>
                                )}
                            </div>
                            
                            <div className="h-14 border-t border-border bg-card flex items-center justify-center">
                                 <span className="text-[9px] font-bold uppercase tracking-[.5em] text-muted-foreground/10">Terminal Output Finalized</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

    );
};

// Simple duration formatter
function formatDuration(startTime?: string) {
    if (!startTime) return "0 MINS SIGNAL LOSS";
    const start = new Date(startTime).getTime();
    if (isNaN(start)) return "CALCULATING SIGNAL...";
    
    const now = new Date().getTime();
    const diffMins = Math.max(0, Math.floor((now - start) / 60000));
    
    if (diffMins < 1) return "LESS THAN 1M SIGNAL LOSS";
    if (diffMins < 60) return `${diffMins} MINS SIGNAL LOSS`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}H ${mins}M SIGNAL LOSS`;
}

export default AlertsPage;
