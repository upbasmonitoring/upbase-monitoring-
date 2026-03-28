import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
    Activity, 
    Globe, 
    Zap, 
    AlertTriangle,
    CheckCircle2,
    ShieldAlert,
    Cpu,
    ArrowUpRight,
    Search,
    Satellite,
    Fingerprint,
    Waves
} from "lucide-react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";

import { useProject } from "@/context/ProjectContext";
import { apiFetch } from "@/lib/api";
import RalphRadar from "@/components/features/dashboard/RalphRadar";

const DashboardPage = () => {
    const { selectedProject } = useProject();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard-stats", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return { total: 0, active: 0, down: 0, avgResponseTime: 0 };
            return await apiFetch(`/monitors/stats?projectId=${selectedProject._id}`);
        },
        refetchInterval: 5000,
        enabled: !!selectedProject?._id
    });

    const { data: monitors, isLoading: monitorsLoading } = useQuery({
        queryKey: ["monitors-live", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return [];
            return await apiFetch(`/monitors?projectId=${selectedProject._id}`);
        },
        refetchInterval: 5000,
        enabled: !!selectedProject?._id
    });

    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ["recent-events", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return [];
            return await apiFetch(`/monitors/events?projectId=${selectedProject._id}`);
        },
        refetchInterval: 5000,
        enabled: !!selectedProject?._id
    });

    const { data: incidents, isLoading: incidentsLoading } = useQuery({
        queryKey: ["all-incidents", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return [];
            return await apiFetch(`/incidents/project/${selectedProject._id}`);
        },
        refetchInterval: 5000,
        enabled: !!selectedProject?._id
    });

    return (
        <div className="space-y-8 sm:space-y-12 pb-10 sm:pb-16 font-sans relative">
            
            {/* --- 🚀 1. WORKSPACE HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400">Monitoring Core v2.4</h2>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-tighter text-slate-900 leading-none">
                        Workspace <span className="text-primary">Overview</span>
                    </h1>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xl">
                        Real-time visibility into your distributed infrastructure stability. 
                        Currently monitoring <span className="text-slate-900">{stats?.total || 0} active nodes</span> across the network.
                    </p>
                </div>

                <div className="flex items-center gap-4 sm:gap-5 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3 sm:p-5 pr-6 sm:pr-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] group hover:border-primary/20 transition-all">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                        <Cpu className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-2">Fleet Health Score</p>
                        <div className="flex items-center gap-4">
                            <span className="text-3xl font-bold tracking-tighter uppercase tabular-nums text-slate-900">98.2<span className="text-[10px] text-slate-300 ml-1 font-bold">PT</span></span>
                            <div className="px-2.5 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100 text-[8px] font-bold tracking-widest">STABLE</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 📊 2. METRIC LEDGER --- */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard 
                    title="Active Monitors" 
                    value={stats?.total || 0} 
                    icon={<Globe className="h-5 w-5 text-blue-500" />} 
                    loading={statsLoading}
                    trend="Operational"
                />
                <StatCard 
                    title="Availability Rate" 
                    value={`${Math.round((stats?.active / stats?.total) * 100) || 100}%`} 
                    icon={<Waves className="h-5 w-5 text-green-500" />} 
                    loading={statsLoading}
                    trend="99.9% High Availability"
                />
                <StatCard 
                    title="Alert Incidents" 
                    value={stats?.down || 0} 
                    icon={<ShieldAlert className={`h-5 w-5 ${stats?.down > 0 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`} />} 
                    valueClass={stats?.down > 0 ? "text-red-500" : "text-slate-900"}
                    loading={statsLoading}
                    trend={stats?.down > 0 ? "Under Investigation" : "No active threats"}
                />
                <StatCard 
                    title="Avg Response Time" 
                    value={`${stats?.avgResponseTime || 0}ms`} 
                    icon={<Activity className="h-5 w-5 text-primary" />} 
                    loading={statsLoading}
                    trend="Optimized Baseline"
                />
            </div>

            {/* --- 📟 3. MONITORING INTERFACE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* --- LEFT: NODE MATRIX --- */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between pb-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400 flex items-center gap-3">
                                <Fingerprint className="h-4 w-4 text-primary" />
                                Real-time Node Resolution
                            </h3>
                            <Link to="/dashboard/monitors" className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary transition-all flex items-center gap-2 group">
                                Manage Full Fleet
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        
                        <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="pl-8 h-14">Monitor Target</TableHead>
                                        <TableHead className="text-center h-14">Stability</TableHead>
                                        <TableHead className="text-center h-14">Avg Latency</TableHead>
                                        <TableHead className="text-right pr-8 h-14">Sync</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monitors?.map((site: any) => (
                                        <TableRow key={site._id} className="border-slate-50 group hover:bg-slate-50/50 transition-all relative h-20">
                                            <TableCell className="pl-8 relative">
                                                <Link to={`/dashboard/monitors/${site._id}`} className="absolute inset-0 z-10" />
                                                <div className="flex items-center gap-5 relative z-0">
                                                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-all shadow-sm">
                                                        <Search className="h-4 w-4 text-slate-200 group-hover:text-primary" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden max-w-[150px] lg:max-w-none">
                                                        <span className="text-sm font-bold text-slate-900 truncate">{site.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{site.url.replace('https://', '').replace('http://', '')}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <StatusBadge status={site.status} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-bold text-slate-900 tabular-nums">{site.responseTime}ms</span>
                                                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5 grayscale brightness-110">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${site.responseTime < 300 ? 'bg-green-500' : site.responseTime < 800 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                                            style={{ width: `${Math.min(100, (site.responseTime / 2000) * 100)}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">{site.lastChecked ? new Date(site.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* --- NEW SECTION: Activity Stream (Wide Layout) --- */}
                    <div className="space-y-5">
                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400 flex items-center gap-3">
                            <Satellite className="h-4 w-4 text-primary" />
                            Live Global Signal Feed
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {events?.length > 0 ? events.slice(0, 6).map((event: any) => (
                                <div key={event._id} className="p-5 rounded-[28px] bg-white border border-slate-100 hover:border-primary/20 transition-all flex items-center gap-4 group shadow-sm">
                                    <div className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center border ${
                                        event.status === 'DOWN' ? 'bg-red-50 border-red-100 text-red-500' : 
                                        'bg-slate-50 border-slate-100 text-slate-400'
                                    }`}>
                                        {event.status === 'DOWN' ? <AlertTriangle className="h-5 w-5" /> : <Fingerprint className="h-5 w-5 opacity-40" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Signal Detection</span>
                                            <span className="text-[8px] font-bold text-slate-300 tabular-nums">{new Date(event.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-900 uppercase truncate">
                                            {event.monitor?.name} <span className="mx-2 opacity-20">||</span> <span className={event.status === 'DOWN' ? 'text-red-500 animate-pulse' : 'text-primary'}>{event.status}</span>
                                        </p>
                                    </div>
                                </div>
                            )) : <div className="col-span-2 h-40 bg-slate-50/50 border border-slate-100 rounded-[28px] border-dashed flex items-center justify-center text-[10px] font-bold uppercase text-slate-300 tracking-[0.2em]">Signal Stable</div>}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: INTELLIGENCE & STATUS --- */}
                <div className="lg:col-span-4 space-y-12">
                     {/* Radar */}
                     <div className="space-y-5">
                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400 flex items-center gap-3">
                            <Zap className="h-4 w-4 text-primary" />
                            Ralph Autopilot Radar
                        </h3>
                        <RalphRadar monitors={monitors || []} incidents={incidents || []} />
                     </div>

                     {/* Mini Stats or Security Badge */}
                     <div className="p-10 rounded-[40px] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <ShieldAlert className="h-28 w-28 text-primary" />
                         </div>
                         <div className="relative space-y-6">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-bold text-white uppercase italic tracking-tight">Active Coverage</p>
                                <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest opacity-60">
                                    Logic engine v.2.1-stable is overseeing all nodes with high frequency polling.
                                </p>
                            </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, loading, trend, valueClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4 sm:p-7 rounded-[20px] sm:rounded-[32px] border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:border-primary/30 hover:shadow-[0_20px_60px_-20px_rgba(0,163,255,0.08)] transition-all group flex flex-col">
        <div className="flex items-center justify-between mb-8">
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-hover:bg-primary/5 shadow-sm">
                {icon}
            </div>
            <div className="h-1.5 w-6 rounded-full bg-slate-100 group-hover:bg-primary/20 transition-all" />
        </div>
        <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-slate-400">{title}</p>
            <h3 className={`text-xl sm:text-3xl font-bold tracking-tighter uppercase tabular-nums ${valueClass}`}>
                {loading ? "---" : value}
            </h3>
            {trend && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                {trend}
            </p>}
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'UP':
        case 'GOOD':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    Optimal
                </div>
            );
        case 'OK':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-blue-50 text-blue-600 border border-blue-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    Stable
                </div>
            );
        case 'DEGRADED':
        case 'SLOW':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-amber-50 text-amber-600 border border-amber-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                    Degraded
                </div>
            );
        case 'DOWN':
            return (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[.25em] bg-red-50 text-red-600 border border-red-100 animate-pulse">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Offline
                </div>
            );
        default:
            return <div className="text-[10px] opacity-20 font-bold uppercase tracking-widest">{status}</div>;
    }
};

export default DashboardPage;
