import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
    GitCommit, 
    GitBranch, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    History,
    Activity,
    AlertTriangle,
    RefreshCcw,
    ShieldAlert,
    X,
    Server,
    Zap,
    Satellite,
    Fingerprint,
    Cpu,
    ArrowUpRight,
    Terminal,
    Target,
    ChevronRight,
    Search,
    Brain,
    Shield,
    ShieldCheck
} from "lucide-react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

const DeploymentsPage = () => {
    const { data: deployments, isLoading } = useQuery({
        queryKey: ["deployments-history"],
        queryFn: async () => {
            return await apiFetch('/monitors/deployments');
        },
        refetchInterval: 5000 
    });

    const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);

    const { data: impactData, isLoading: impactLoading } = useQuery({
        queryKey: ["deployment-impact", selectedImpactId],
        queryFn: async () => {
            if (!selectedImpactId) return null;
            return await apiFetch(`/deployments/${selectedImpactId}/impact`);
        },
        enabled: !!selectedImpactId
    });

    return (
            <div className="space-y-12 pb-20 font-sans relative">
                
                {/* --- 🚀 1. DEPLOYMENT HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-3 lg:max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,163,255,0.4)]" />
                            <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/60">CI/CD Pipeline</h2>
                        </div>
                        <h1 className="text-4xl font-bold uppercase tracking-tighter text-foreground leading-none">
                            Release <span className="text-primary">History</span>
                        </h1>
                        <p className="text-sm font-semibold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                            Audit stream for code pushes and production environment transitions. 
                            Automatic impact analysis for every rollout.
                        </p>
                    </div>

                    <div className="flex items-center gap-5 px-10 py-6 bg-card border border-border rounded-[32px] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] group hover:border-primary/20 transition-all">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-none mb-2">Release Stability</span>
                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-bold tracking-tighter tabular-nums text-foreground leading-none uppercase">
                                    96.8<span className="text-[10px] text-muted-foreground/30 ml-1 font-bold">PT</span>
                                </span>
                                <div className="px-2 py-0.5 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 text-[8px] font-bold tracking-widest">STABLE</div>
                            </div>
                         </div>
                         <div className="h-10 w-px bg-border/50" />
                         <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            <GitCommit className="h-6 w-6" />
                         </div>
                    </div>
                </div>

                {/* --- 📟 2. DEPLOYMENT LEDGER --- */}
                <div className="bg-card rounded-[40px] border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase tracking-[.3em] text-muted-foreground/50 pl-10 h-18">Version Sync</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[.3em] text-muted-foreground/50 h-18">Repository Path</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[.3em] text-muted-foreground/50 text-center h-18">Rollout Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[.3em] text-muted-foreground/50 text-center h-18">Post-Rollout Health</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-[.3em] text-muted-foreground/50 text-right pr-10 h-18">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [1,2,3,4].map(i => (
                                    <TableRow key={i} className="animate-pulse border-border h-28">
                                        <TableCell colSpan={5} className="bg-secondary/10" />
                                    </TableRow>
                                ))
                            ) : deployments?.length > 0 ? (
                                deployments.map((deploy: any) => (
                                    <TableRow key={deploy._id} className="border-border group hover:bg-secondary/20 transition-all h-28 relative">
                                        <TableCell className="pl-10 relative">
                                            <div className="flex items-center gap-6">
                                                <div onClick={() => setSelectedImpactId(deploy._id)} className="h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground/30 group-hover:border-primary group-hover:bg-primary/5 group-hover:text-primary cursor-pointer transition-all shrink-0 shadow-sm">
                                                    <GitCommit className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col gap-1 overflow-hidden">
                                                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-all">#{deploy.commitSha?.substring(0, 7) || 'UNKNOWN'}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[250px]">{deploy.commitMessage || 'Automated deployment sync'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xs font-bold text-foreground/80 uppercase tracking-widest leading-none">{deploy.repo}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase flex items-center gap-2">
                                                    <GitBranch className="h-3.5 w-3.5" />
                                                    {deploy.branch || 'main'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DeployStatus status={deploy.status} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                 {deploy.impact?.length > 0 ? (
                                                     <div className="space-y-2">
                                                        <div className="px-4 py-1.5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-bold uppercase tracking-widest">
                                                            Incident Detected
                                                        </div>
                                                        <button 
                                                            onClick={() => setSelectedImpactId(deploy._id)}
                                                            className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-2 justify-center"
                                                        >
                                                            View Impact <ArrowUpRight className="h-3.5 w-3.5" />
                                                        </button>
                                                     </div>
                                                 ) : (
                                                     <div className="flex flex-col items-center gap-1.5">
                                                        <div className={`inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest ${deploy.healthStatus === 'OK' ? 'text-green-500' : 'text-muted-foreground/30'}`}>
                                                            {deploy.healthStatus === 'OK' ? <ShieldCheck className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                                            {deploy.healthStatus || 'TELEMETRY PENDING'}
                                                        </div>
                                                        {deploy.healthStatus === 'OK' && (
                                                            <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">Verified Baseline</span>
                                                        )}
                                                     </div>
                                                 )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="text-[11px] font-bold text-foreground uppercase tracking-widest tabular-nums">{new Date(deploy.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{new Date(deploy.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-80 text-muted-foreground/20 font-bold uppercase tracking-[.4em] text-sm italic">
                                        <div className="flex flex-col items-center gap-10">
                                            <Satellite className="h-16 w-16 opacity-30" />
                                            Awaiting First Release Sync
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* --- 🔬 IMPACT ANALYSIS DRAWER --- */}
                {selectedImpactId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-end font-sans">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-500" onClick={() => setSelectedImpactId(null)} />
                        
                        <div className="relative w-full max-w-2xl h-full bg-card shadow-[-50px_0_100px_rgba(0,0,0,0.5)] p-0 flex flex-col animate-in slide-in-from-right duration-500 border-l border-border text-foreground">
                            {/* Drawer Header */}
                            <div className="p-10 flex items-center justify-between border-b border-border bg-secondary/20">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                            <AlertTriangle className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold uppercase tracking-tighter text-foreground leading-none">
                                                Impact <span className="text-red-500">Analysis</span>
                                            </h2>
                                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[.4em] mt-1.5 whitespace-nowrap">Incident Telemetry Log</p>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedImpactId(null)} className="h-12 w-12 rounded-2xl hover:bg-secondary group">
                                    <X className="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground transition-all" />
                                </Button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-12 space-y-14 custom-scrollbar">
                                {/* Impact Status Hub */}
                                <div className="p-10 rounded-[40px] bg-red-500/5 border border-red-500/10 space-y-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                                        <ShieldAlert className="h-32 w-32 text-red-500" />
                                    </div>
                                    
                                    <div className="flex items-start gap-8 relative z-10">
                                        <div className="h-16 w-16 rounded-2xl bg-card border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm">
                                            <Target className="h-8 w-8 text-red-500" />
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            <h3 className="text-lg font-bold uppercase tracking-widest text-red-500">Performance Regression</h3>
                                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-tight leading-relaxed">Direct correlation between Commit #{impactData?.commitId?.slice(0,7)} and node instability.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-10 pt-8 border-t border-red-500/10 relative z-10">
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 leading-none">Affected Node</span>
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-card border border-red-500/20 flex items-center justify-center shadow-sm">
                                                    <Server className="h-5 w-5 text-red-300" />
                                                </div>
                                                <span className="text-sm font-bold uppercase text-foreground">{impactData?.monitor?.name || 'UNDETERMINED'}</span>
                                            </div>
                                        </div>
                                         <div className="space-y-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 leading-none">Signal Status</span>
                                            <div className="flex items-center gap-4">
                                                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                                                <span className="text-sm font-bold uppercase text-red-500">Degraded</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Intelligent Analysis */}
                                {impactData?.incident?.aiRca && (
                                    <div className="space-y-5">
                                        <h4 className="text-[11px] font-bold uppercase tracking-[.3em] text-muted-foreground/40 flex items-center gap-3">
                                            <Brain className="h-5 w-5 text-primary" />
                                            Root Cause Diagnostics
                                        </h4>
                                        <div className="p-10 rounded-[40px] bg-primary/10 border border-primary/20 space-y-6 shadow-sm">
                                            <p className="text-sm font-semibold text-foreground/80 leading-relaxed uppercase tracking-tight">
                                                "{impactData.incident.aiRca}"
                                            </p>
                                            <div className="pt-4 flex items-center gap-3">
                                                 <div className="px-3 py-1 rounded-lg bg-primary/10 text-[9px] font-bold text-primary tracking-widest uppercase border border-primary/20">Confidence: 98.4%</div>
                                                 <div className="px-3 py-1 rounded-lg bg-secondary text-[9px] font-bold text-muted-foreground/40 tracking-widest uppercase border border-border">System Engine: V2.4</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Forensic Timeline */}
                                <div className="space-y-10">
                                    <h4 className="text-[11px] font-bold uppercase tracking-[.3em] text-muted-foreground/40 flex items-center gap-3">
                                        <History className="h-5 w-5 text-primary" />
                                        Resolution Timeline
                                    </h4>
                                    <div className="space-y-0 relative pl-10 border-l border-border ml-2">
                                        <TimelineEvent 
                                            label="Release Distribution" 
                                            time="T+0ms" 
                                            status="primary"
                                            message={`Edge sync initiated for bundle ${impactData?.repo}. Propagating revisions across nodes.`}
                                        />

                                        {impactData?.incident?.timeline.map((event: any, idx: number) => (
                                            <TimelineEvent 
                                                key={idx}
                                                label={event.type.replace(/_/g, ' ')}
                                                time={`[${new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`}
                                                status={event.type.includes('DETECTED') || event.type.includes('FAIL') ? 'red' : 'primary'}
                                                message={event.message}
                                            />
                                        ))}

                                        {impactData?.status === 'SUCCESS' && (
                                            <TimelineEvent 
                                                label="Recovery Finalized" 
                                                time="COMPLETED" 
                                                status="green"
                                                message="Operational health restored. Environment baseline verified stable."
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-12 bg-secondary/30 border-t border-border flex gap-6">
                                <Button className="flex-1 rounded-2xl text-[11px] font-bold uppercase tracking-widest h-16 bg-red-600 hover:bg-red-700 text-white shadow-[0_15px_30px_rgba(220,38,38,0.3)] border-0 transition-all">
                                    Trigger Emergency Rollback
                                </Button>
                                <Button variant="outline" className="rounded-2xl text-[11px] font-bold uppercase tracking-widest h-16 px-12 border-border bg-card hover:bg-secondary transition-all text-muted-foreground" onClick={() => setSelectedImpactId(null)}>
                                    Clear Feed
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
};

const TimelineEvent = ({ label, time, status, message }: any) => (
    <div className="relative pb-12 last:pb-0 group">
        <div className={`absolute -left-[46.5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-card z-10 transition-all duration-500 group-hover:scale-125 ${
            status === 'red' ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 
            status === 'green' ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 
            'border-primary shadow-[0_0_10px_rgba(0,163,255,0.3)]'
        }`} />
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                    status === 'red' ? 'text-red-500' : 
                    status === 'green' ? 'text-green-500' : 
                    'text-foreground group-hover:text-primary'
                }`}>{label}</span>
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tabular-nums">{time}</span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight leading-relaxed max-w-lg">{message}</p>
        </div>
    </div>
);

const DeployStatus = ({ status }: any) => {
    switch (status) {
        case 'FAIL':
        case 'FAILED':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-red-500/10 text-red-500 border border-red-500/20">
                    <XCircle className="h-4 w-4" />
                    Failed
                </div>
            );
        case 'PUSHED':
        case 'SUCCESS':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-green-500/10 text-green-500 border border-green-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    Success
                </div>
            );
        case 'PENDING':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse">
                    <Clock className="h-4 w-4" />
                    Rolling
                </div>
            );
        case 'ROLLBACK':
        case 'ROLLED_BACK':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <RefreshCcw className="h-4 w-4" />
                    Rollback
                </div>
            );
        default:
            return <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">{status}</div>;
    }
};

export default DeploymentsPage;
