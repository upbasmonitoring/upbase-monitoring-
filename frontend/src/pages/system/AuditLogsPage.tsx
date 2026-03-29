import React, { useState, useEffect } from 'react';
import { useProject } from "@/context/ProjectContext";
import { 
    ShieldCheck, 
    Link as LinkIcon, 
    Fingerprint, 
    Search, 
    History, 
    Filter, 
    ChevronRight, 
    Activity,
    Lock,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { apiFetch } from '@/lib/api';

const AuditLogsPage = () => {
    const { selectedProject } = useProject();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!selectedProject?._id) return;
            setLoading(true);
            try {
                const response = await apiFetch(`/audit/logs?projectId=${selectedProject._id}`);
                setLogs(response || []);
            } catch (error) {
                console.error("Failed to load audit logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [selectedProject]);

    return (
        <div className="space-y-12 pb-20 font-sans">
            {/* --- 🛡️ 1. ARCHITECTURE HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="space-y-4 lg:max-w-md">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/40">Security & Integrity</h2>
                    </div>
                    <h1 className="text-4xl font-bold uppercase tracking-tighter text-foreground leading-none">
                        Audit <span className="text-emerald-500">Record</span>
                    </h1>
                    <p className="text-sm font-semibold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                        Blockchain-verified event visualization. Every system mutation is hashed and anchored for absolute tamper-proof verification.
                    </p>
                </div>
                <div className="flex items-center gap-5">
                    <Button variant="outline" className="h-14 rounded-2xl px-10 text-[10px] font-bold uppercase tracking-widest border-border hover:bg-secondary text-muted-foreground/60 transition-all">
                        <Filter className="mr-3 h-4 w-4 opacity-40" /> Filter Grid
                    </Button>
                    <Button className="h-14 rounded-2xl px-10 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all">
                        <ShieldCheck className="mr-3 h-4 w-4" /> Verify Chain
                    </Button>
                </div>
            </div>

            {/* --- 📊 2. VERIFICATION GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard 
                    label="Hashed Mutants" 
                    value={logs.length.toString()} 
                    icon={<Fingerprint className="h-5 w-5" />} 
                    status="Verified"
                />
                <StatsCard 
                    label="Blockchain Anchor" 
                    value="Polygon Mainnet" 
                    icon={<Globe className="h-5 w-5" />} 
                    status="Connected"
                />
                <StatsCard 
                    label="Integrity Score" 
                    value="100%" 
                    icon={<ShieldCheck className="h-5 w-5" />} 
                    status="Nominal"
                />
            </div>

            {/* --- 📜 3. AUDIT FEED --- */}
            <div className="bg-card rounded-[40px] border border-border shadow-sm overflow-hidden">
                <div className="h-18 px-10 border-b border-border flex items-center justify-between bg-secondary/30">
                    <div className="flex items-center gap-4">
                        <Lock className="h-4 w-4 text-muted-foreground/30" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/40">Immutable Event Sequence</h3>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">Anchoring Enabled</span>
                    </div>
                </div>

                <div className="min-h-[500px] p-10 lg:p-14 space-y-8">
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-3xl bg-secondary/20 animate-pulse border border-border" />)}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center gap-6">
                            <History className="h-12 w-12 text-muted-foreground/10" />
                            <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">No mutations recorded in verified cache</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {logs.map((log: any) => (
                                <div key={log._id} className="group p-8 bg-card border border-border rounded-[32px] hover:border-emerald-500/20 transition-all cursor-default relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                                    <div className="flex items-center gap-8 flex-1 min-w-0">
                                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-secondary border border-border flex flex-col items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors shadow-sm text-muted-foreground/20 group-hover:text-emerald-500">
                                            <span className="text-[8px] font-black uppercase leading-none mb-1 opacity-40">Anchor</span>
                                            <LinkIcon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <h3 className="text-base font-bold text-foreground uppercase tracking-tighter truncate group-hover:text-emerald-500 transition-colors">
                                                {log.action || 'System Mutation'}
                                            </h3>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Fingerprint className="h-3.5 w-3.5 text-muted-foreground/20" />
                                                    <span className="text-[9px] font-bold font-mono text-muted-foreground/40 uppercase tracking-widest">
                                                        {log.hash?.substring(0, 16)}...
                                                    </span>
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-border" />
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-3.5 w-3.5 text-muted-foreground/20" />
                                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                                        {log.user?.email || 'System Engine'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10 shrink-0">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-foreground tracking-tight leading-none">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </span>
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-2 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">Verified mutation</span>
                                        </div>
                                        <div className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground/30 group-hover:text-emerald-500 group-hover:bg-card group-hover:border-emerald-500/20 transition-all shadow-none group-hover:shadow-sm">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ label, value, icon, status }: any) => (
    <div className="bg-card p-10 rounded-[40px] border border-border shadow-sm hover:border-emerald-500/20 transition-all group overflow-hidden relative">
        <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground/40 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all shadow-sm">
                {icon}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest leading-none">{status}</span>
            </div>
        </div>
        <div className="space-y-2 relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-muted-foreground/30">{label}</p>
            <h3 className="text-3xl font-bold tracking-tighter uppercase tabular-nums text-foreground group-hover:text-emerald-500 transition-colors leading-none">
                {value}
            </h3>
        </div>
    </div>
);

export default AuditLogsPage;
