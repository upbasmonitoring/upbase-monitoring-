import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
    Activity, 
    ArrowLeft, 
    Globe, 
    CheckCircle2, 
    Clock, 
    History,
    Zap,
    ExternalLink,
    Brain,
    Sparkles,
    Gauge,
    TrendingDown,
    ShieldAlert,
    Satellite,
    Fingerprint,
    Cpu,
    Waves,
    Target,
    Link2,
    Search,
    ChevronRight,
    ArrowUpRight,
    Terminal,
    ShieldCheck,
    RefreshCcw,
    PauseCircle,
    PlayCircle,
    BellOff
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

const MonitorDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [range, setRange] = React.useState("1h");

    const { data: monitor, isLoading: monitorLoading } = useQuery({
        queryKey: ["monitor-detail", id],
        queryFn: async () => {
            return await apiFetch(`/monitors/${id}`);
        },
        refetchInterval: 5000
    });

    const { data: logs, isLoading: logsLoading } = useQuery({
        queryKey: ["monitor-history", id, range],
        queryFn: async () => {
            return await apiFetch(`/monitors/${id}/logs?range=${range}`);
        },
        refetchInterval: 10000
    });

    const { data: analytics } = useQuery({
        queryKey: ["monitor-analytics", id, range],
        queryFn: async () => {
            if (!monitor?.project) return null;
            return await apiFetch(`/projects/${typeof monitor.project === 'object' ? monitor.project._id : monitor.project}/analytics?monitorId=${id}&range=${range}`);
        },
        enabled: !!monitor?.project,
        refetchInterval: 15000
    });

    const recoveryMutation = useMutation({
        mutationFn: async () => {
            return await apiFetch(`/monitors/${id}/recover`, { method: "POST" });
        },
        onSuccess: () => {
            toast.success("Recovery sequence initiated successfully!", {
                description: "The AI agent is now analyzing the node health.",
            });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to trigger recovery");
        }
    });

    const toggleHealMutation = useMutation({
        mutationFn: async () => {
            return await apiFetch(`/monitors/${id}/healing/toggle`, { method: "PUT" });
        },
        onSuccess: (data) => {
            toast.success(data.message, {
                description: "Autopilot configuration updated.",
            });
            queryClient.invalidateQueries({ queryKey: ["monitor-detail", id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to toggle auto-healing");
        }
    });
    
    const silenceMutation = useMutation({
        mutationFn: async (duration: number) => {
            return await apiFetch(`/monitors/${id}/silence`, { 
                method: "PUT",
                body: JSON.stringify({ duration })
            });
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["monitor-detail", id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to silence monitor");
        }
    });

    const { data: incidents, isLoading: incidentsLoading } = useQuery({
        queryKey: ["monitor-incidents", id],
        queryFn: async () => {
            return await apiFetch(`/incidents/${id}`);
        },
        refetchInterval: 5000
    });

    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ["monitor-insights", id],
        queryFn: async () => {
            return await apiFetch(`/monitors/${id}/insights`);
        },
        refetchInterval: 15000
    });

    // 2. UNIFY INTELLIGENCE FEED
    const combinedInsights = [
        ...(analytics?.insights || []).map((ins: any) => ({ ...ins, _id: `analytics-${ins.message}` })),
        ...(insights || [])
    ];

    if (monitorLoading || !monitor) return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
                <div className={`h-14 w-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center ${monitorLoading ? 'animate-spin' : ''}`}>
                    {monitorLoading ? <Satellite className="h-7 w-7 text-primary" /> : <ShieldAlert className="h-7 w-7 text-red-400" />}
                </div>
                <div className="space-y-1 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[.5em] text-primary italic">
                        {monitorLoading ? "Synchronizing Uplink" : "Uplink Failure"}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {monitorLoading ? "Establishing secure telemetry handshake..." : "Telemetric signal not found or access denied."}
                    </p>
                    {!monitorLoading && (
                        <Button variant="link" onClick={() => navigate('/dashboard')} className="text-[10px] text-primary font-bold uppercase tracking-widest mt-4">
                            Return to Fleet Command
                        </Button>
                    )}
                </div>
            </div>
    );

    // 1. SAFE DATA EXTRACTION & DEBUG
    console.log("API DATA:", logs);
    const rawLogs = logs?.logs || [];
    console.log("LOGS:", rawLogs);

    const p95 = logs?.p95 || 0;
    const p50 = logs?.p50 || 0;
    const totalSamples = logs?.totalSamples || 0;

    const errorLogs = rawLogs.filter((l: any) => l.status !== 'UP') || [];

    // 2. FIX N/A ISSUE - Fallback to last known sample
    const displayP95Value = p95 > 0 ? `${p95}ms` : (rawLogs.length ? `${rawLogs[rawLogs.length - 1].latency}ms` : "N/A");
    const displayP50Value = p50 > 0 ? `${p50}ms` : "N/A";

    return (
            <div className="space-y-8 sm:space-y-12 pb-12 sm:pb-20 font-sans relative">
                
                {/* --- 🚀 1. TELEMETRY HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-10">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)} 
                            className="h-10 w-10 sm:h-14 sm:w-14 bg-card border border-border rounded-xl sm:rounded-2xl hover:border-primary/40 group shadow-sm transition-all shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-all" />
                        </Button>
                        <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <h1 className="text-2xl sm:text-4xl font-bold tracking-tighter uppercase text-foreground leading-none">
                                    {monitor.name} <span className="text-primary italic">Detail</span>
                                </h1>
                                <StatusBadge status={monitor.status} />
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[.3em]">
                                <Globe className="h-3.5 w-3.5 text-primary/40" />
                                <a 
                                    href={monitor.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 group"
                                >
                                    {monitor.url}
                                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-card border border-border rounded-xl sm:rounded-2xl shadow-sm overflow-x-auto">
                        {["1h", "24h", "7d"].map((r) => (
                            <Button 
                                key={r} 
                                variant={range === r ? "secondary" : "ghost"} 
                                size="sm" 
                                onClick={() => setRange(r)}
                                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest h-8 sm:h-10 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${
                                    range === r 
                                    ? 'bg-primary text-white shadow-[0_10px_20px_rgba(0,163,255,0.2)]' 
                                    : 'text-muted-foreground/40 hover:text-foreground hover:bg-secondary'
                                }`}
                            >
                                {r} Window
                            </Button>
                        ))}
                    </div>
                </div>

                {/* --- 📊 2. TELEMETRY CARDS --- */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
                    <TelemetryCard label="Uptime Reality" value={`${monitor.uptimePercentage || 100}%`} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />

                    <TelemetryCard 
                        label="P95 Latency" 
                        value={displayP95Value} 
                        icon={<Activity className="h-5 w-5 text-primary" />} 
                    />
                    <TelemetryCard 
                        label="P50 Stability" 
                        value={displayP50Value} 
                        icon={<Target className="h-5 w-5 text-emerald-500" />} 
                    />
                    <TelemetryCard label="Sample Yield" value={totalSamples} icon={<Clock className="h-5 w-5 text-blue-400" />} />
                    <TelemetryCard label="Incident Ledger" value={errorLogs.length} icon={<ShieldAlert className="h-5 w-5 text-red-500" />} />
                    <TelemetryCard label="Fleet Health" value={`${monitor.healthScore || 100} PT`} icon={<Gauge className="h-5 w-5 text-indigo-500" />} glow={true} />
                </div>

                {/* --- 📉 3. SIGNAL MATRIX (CHART) --- */}
                <div className="bg-card rounded-[24px] sm:rounded-[40px] border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="h-12 sm:h-18 px-4 sm:px-10 border-b border-secondary flex items-center justify-between bg-secondary/30">
                        <h3 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[.2em] sm:tracking-[.4em] text-muted-foreground flex items-center gap-2 sm:gap-3">
                            <Waves className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                            <span className="hidden sm:inline">Signal Handshake Latency (MS)</span>
                            <span className="sm:hidden">Latency (MS)</span>
                        </h3>
                        <div className="flex items-center gap-3">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,163,255,0.4)] animate-pulse" />
                             <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">Live Relay Active</span>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[350px] lg:h-[450px] w-full p-4 sm:p-8 lg:p-12 pb-4 sm:pb-6 flex items-center justify-center">
                        {rawLogs.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={rawLogs}>

                                <defs>
                                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0,0,0,0.02)" />
                                <XAxis 
                                    dataKey="timestamp" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }}
                                    tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        border: '1px solid hsl(var(--border))', 
                                        borderRadius: '24px',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ fontSize: '11px', color: 'hsl(var(--primary))', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    labelStyle={{ fontSize: '9px', color: 'hsl(var(--muted-foreground))', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                    labelFormatter={(label) => `Timestamp: ${label ? new Date(label).toLocaleString() : 'N/A'}`}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="latency" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#latencyGrad)" 
                                    animationDuration={2000}
                                    animationBegin={300}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground/30">
                                <Activity className="h-10 w-10 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No Pulse Data Available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 📈 DETAILED ANALYTICS MODULE --- */}
                {analytics && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                        {/* Status Code Distribution */}
                        <div className="bg-card p-6 sm:p-10 rounded-[24px] sm:rounded-[48px] border border-border shadow-sm relative overflow-hidden group transition-colors">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
                                <Search className="h-24 w-24 text-primary" />
                            </div>
                            <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[.4em] text-muted-foreground mb-8 flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Traffic Distribution
                            </h3>
                            <div className="h-[280px] w-full flex items-center justify-center">
                                {analytics.statusCodeDistribution?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <defs>
                                                <filter id="shadow" height="200%">
                                                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                                    <feOffset dx="0" dy="4" result="offsetblur" />
                                                    <feComponentTransfer>
                                                        <feFuncA type="linear" slope="0.2" />
                                                    </feComponentTransfer>
                                                    <feMerge>
                                                        <feMergeNode />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <Pie 
                                                data={analytics.statusCodeDistribution} 
                                                innerRadius={70} 
                                                outerRadius={95} 
                                                paddingAngle={8} 
                                                dataKey="value"
                                                stroke="none"
                                                animationDuration={1200}
                                            >
                                                {analytics.statusCodeDistribution.map((entry: any, index: number) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'][index % 4]} 
                                                        style={{ filter: 'url(#shadow)' }}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ 
                                                    borderRadius: '24px', 
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))', 
                                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                                    padding: '12px 16px'
                                                }}
                                                itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                            />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                align="center"
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.1em', paddingTop: '30px', textTransform: 'uppercase' }} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest flex items-center gap-3">
                                        <Activity className="h-8 w-8 opacity-20" /> No Telemetry Found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Timeline */}
                        <div className="bg-card p-6 sm:p-10 rounded-[24px] sm:rounded-[48px] border border-border shadow-sm relative overflow-hidden group transition-colors">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
                                <TrendingDown className="h-24 w-24 text-red-500" />
                            </div>
                            <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[.4em] text-muted-foreground mb-8 flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                Incident Volatility
                            </h3>
                            <div className="h-[280px] w-full flex items-center justify-center">
                                {analytics.errorTimeline?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.errorTimeline}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.02)" />
                                            <XAxis 
                                                dataKey="timestamp" 
                                                tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                                fontSize={9} 
                                                axisLine={false} 
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontWeight: 'bold' }}
                                            />
                                            <YAxis fontSize={9} axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                                            <Tooltip 
                                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                contentStyle={{ 
                                                    borderRadius: '24px', 
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))', 
                                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                                    padding: '12px 16px'
                                                }}
                                                labelStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}
                                                labelFormatter={(label) => `Window: ${new Date(label).toLocaleTimeString()}`}
                                            />
                                            <Bar 
                                                dataKey="errors" 
                                                fill="#ef4444" 
                                                radius={[10, 10, 0, 0]} 
                                                maxBarSize={30} 
                                                animationDuration={1500}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 py-10">
                                        <div className="h-16 w-16 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner animate-slow-pulse">
                                            <ShieldCheck className="h-8 w-8 text-emerald-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-black uppercase text-foreground tracking-[0.2em] mb-1">Signal Clean</p>
                                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest max-w-[180px] leading-relaxed">No deviations detected in this timeframe.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 🛠️ 4. FORENSICS & INTELLIGENCE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                    
                    {/* Incident Timeline (2/3) */}
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground flex items-center gap-3">
                             <Fingerprint className="h-5 w-5 text-primary" />
                             Signal Forensics Ledger
                        </h3>

                        <div className="space-y-6 sm:space-y-10">
                            {incidents?.length > 0 ? incidents.map((incident: any) => (
                                <div key={incident._id} className={`bg-card rounded-2xl sm:rounded-[40px] border transition-all overflow-hidden ${incident.status === 'OPEN' ? 'border-red-500/20 shadow-lg' : 'border-border grayscale-[0.8] opacity-60 shadow-sm'}`}>
                                    <div className={`px-4 sm:px-10 h-12 sm:h-16 flex items-center justify-between border-b ${incident.status === 'OPEN' ? 'bg-red-500/5 border-red-500/10' : 'bg-secondary/30 border-border'}`}>
                                        <div className="flex items-center gap-3 sm:gap-5">
                                            <div className={`h-2.5 w-2.5 rounded-full ${incident.status === 'OPEN' ? 'bg-red-500 animate-pulse-slow shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-muted-foreground/30'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${incident.status === 'OPEN' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                {incident.status === 'OPEN' ? 'Signal Severed' : 'Signal Restored'}
                                            </span>
                                            <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-tighter">REF: {incident._id.slice(-8)}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">{new Date(incident.startedAt).toLocaleString()}</span>
                                    </div>

                                    <div className="p-5 sm:p-8 lg:p-12 space-y-6 sm:space-y-12">
                                        {incident.aiRca && (
                                            <div className="relative p-5 sm:p-8 rounded-xl sm:rounded-[32px] bg-primary/5 border border-primary/10 flex gap-4 sm:gap-6 items-start">
                                                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-card border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold uppercase text-primary tracking-widest leading-none">AI Root Cause Audit</p>
                                                    <p className="text-sm font-semibold text-foreground leading-relaxed uppercase tracking-tight">"{incident.aiRca}"</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative pl-6 sm:pl-12 space-y-6 sm:space-y-10 border-l border-border ml-2 sm:ml-3">
                                            {incident.timeline.map((event: any, idx: number) => (
                                                <div key={idx} className="relative group">
                                                    <div className={`absolute -left-[30px] sm:-left-[54px] top-1.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 bg-card z-10 transition-all ${
                                                        ['RECOVERED', 'AI_FIX_APPLIED'].includes(event.type) ? 'border-primary shadow-[0_0_10px_rgba(0,163,255,0.3)]' : 
                                                        event.type.includes('DETECTED') || event.type.includes('FAILED') ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 
                                                        'border-muted-foreground/30'
                                                    }`} />
                                                    
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${
                                                                ['RECOVERED', 'AI_FIX_APPLIED'].includes(event.type) ? 'text-primary' : 
                                                                event.type.includes('DETECTED') || event.type.includes('FAILED') ? 'text-red-600' : 
                                                                'text-foreground group-hover:text-primary transition-all'
                                                            }`}>
                                                                {getEventIcon(event.type)} {event.type.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tabular-nums">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                        <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 uppercase tracking-tight leading-relaxed max-w-2xl">{event.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-[250px] sm:h-[400px] bg-card border border-border rounded-[24px] sm:rounded-[40px] flex flex-col items-center justify-center gap-6 sm:gap-10 group shadow-sm px-4">
                                    <div className="h-20 w-20 rounded-[32px] bg-secondary/30 border border-border flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                         <Target className="h-10 w-10 text-muted-foreground/20 group-hover:text-primary transition-all animate-slow-pulse" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <p className="text-[12px] font-bold uppercase tracking-[.5em] text-foreground">Node Integrity Secure</p>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground/30 tracking-widest">Awaiting First Deviation Pulse</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Insights & Actions (1/3) */}
                    <div className="space-y-8 sm:space-y-12">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400 flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Smart Intelligence
                            </h3>
                            <div className="space-y-6">
                                {combinedInsights.length > 0 ? (
                                    combinedInsights.map((insight: any) => (
                                        <div key={insight._id} 
                                             className={`p-5 sm:p-8 bg-card border rounded-2xl sm:rounded-[32px] space-y-4 sm:space-y-5 group hover:border-primary/30 transition-all shadow-sm ${
                                                insight.type === 'HIGH' || insight.type === 'CRITICAL' || insight.type === 'danger' ? 'border-red-500/10' : 
                                                insight.severity === 'MEDIUM' || insight.type === 'warning' ? 'border-yellow-500/10' : 'border-emerald-500/10'
                                             }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className={`px-3 py-1 rounded-lg border text-[9px] font-bold tracking-widest uppercase italic ${
                                                    insight.type === 'HIGH' || insight.type === 'CRITICAL' || insight.type === 'danger' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                                    insight.severity === 'MEDIUM' || insight.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>{insight.type || 'ANALYSIS'} REPORT</div>
                                                <span className="text-[9px] font-bold text-muted-foreground/30 tabular-nums">{insight.createdAt ? new Date(insight.createdAt).toLocaleTimeString() : 'LIVE'}</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 text-muted-foreground/40 group-hover:text-primary transition-all">
                                                    {insight.type === 'danger' ? <ShieldAlert className="h-5 w-5" /> : 
                                                     insight.type === 'warning' ? <TrendingDown className="h-5 w-5" /> :
                                                     <Brain className="h-5 w-5" />}
                                                </div>
                                                <p className="text-sm font-semibold text-foreground leading-tight uppercase tracking-tight italic">"{insight.message}"</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 bg-card border border-border rounded-[32px] flex flex-col items-center justify-center gap-6 text-center shadow-sm">
                                        <Brain className="h-8 w-8 text-muted-foreground/20" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Scan Underway</p>
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground/10 tracking-widest">Patterns pending resolution</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground flex items-center gap-3">
                                <Zap className="h-5 w-5 text-indigo-500" />
                                Autonomic Controls
                            </h3>
                            <div className="bg-card border border-border rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 space-y-6 sm:space-y-8 shadow-sm">
                                {monitor.githubRepo?.repo ? (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3 sm:gap-5">
                                            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                                <Cpu className="h-5 w-5 sm:h-7 sm:w-7" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs sm:text-sm font-bold tracking-tighter text-foreground uppercase truncate">{monitor.githubRepo.owner}/{monitor.githubRepo.repo}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Active Branch: {monitor.githubRepo.branch}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <Button 
                                                onClick={() => recoveryMutation.mutate()}
                                                disabled={recoveryMutation.isPending}
                                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest h-12 sm:h-16 rounded-xl sm:rounded-2xl shadow-[0_15px_30px_rgba(0,163,255,0.2)] transition-all active:scale-95 flex items-center gap-2 sm:gap-3 justify-center text-[9px] sm:text-[10px]"
                                            >
                                                {recoveryMutation.isPending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                {recoveryMutation.isPending ? "Executing..." : "Manual Recovery"}
                                            </Button>

                                            <Button 
                                                onClick={() => toggleHealMutation.mutate()}
                                                disabled={toggleHealMutation.isPending}
                                                variant="outline"
                                                className={`w-full flex flex-col items-center justify-center text-[8px] sm:text-[9px] font-bold uppercase tracking-widest h-12 sm:h-16 rounded-xl sm:rounded-2xl border-2 transition-all active:scale-95 ${
                                                    monitor.autoHealPaused 
                                                        ? 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 shadow-[0_10px_20px_rgba(16,185,129,0.1)]' 
                                                        : 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {toggleHealMutation.isPending ? <RefreshCcw className="h-3 w-3 animate-spin" /> : 
                                                     monitor.autoHealPaused ? <PlayCircle className="h-3 w-3" /> : <PauseCircle className="h-3 w-3" />}
                                                    {monitor.autoHealPaused ? "Force Auto-Mode ON" : "Pause Autopilot"}
                                                </div>
                                                {!monitor.autoHealPaused && (
                                                    <span className="text-[8px] opacity-60 mt-1">
                                                        Daily limit: {monitor.rollbackTodayCount || 0}/1 used
                                                    </span>
                                                )}
                                            </Button>

                                            <Button 
                                                onClick={() => silenceMutation.mutate(monitor.silenceUntil ? 0 : 60)}
                                                disabled={silenceMutation.isPending}
                                                variant="outline"
                                                className={`w-full sm:col-span-2 flex flex-col items-center justify-center text-[8px] sm:text-[9px] font-bold uppercase tracking-widest h-12 sm:h-16 rounded-xl sm:rounded-2xl border-2 transition-all active:scale-95 ${
                                                    monitor.silenceUntil 
                                                        ? 'border-primary text-primary hover:bg-primary/10 bg-primary/5' 
                                                        : 'border-border text-muted-foreground/40 hover:bg-secondary'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {silenceMutation.isPending ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <BellOff className="h-4 w-4" />}
                                                    {monitor.silenceUntil ? "Re-Enable Alerts" : "Silence Alarms (1h)"}
                                                </div>
                                                {monitor.silenceUntil && (
                                                    <span className="text-[8px] opacity-60 mt-1">
                                                        Silenced til {new Date(monitor.silenceUntil).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-10 py-4 text-center">
                                         <Link2 className="h-12 w-12 text-muted-foreground/10" />
                                         <div className="space-y-2">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40">No Uplink Established</p>
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground/5 tracking-widest px-8">Connect a repository for automated recovery logic.</p>
                                         </div>
                                         <Button asChild variant="outline" className="text-[10px] font-bold uppercase h-12 px-10 rounded-2xl border-border hover:bg-secondary transition-all text-muted-foreground">
                                            <Link to="/dashboard/monitors?add=true">Establish Uplink</Link>
                                         </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
    );
};

const TelemetryCard = ({ label, value, icon, glow }: any) => (
    <div className={`bg-card border border-border rounded-2xl sm:rounded-[32px] p-4 sm:p-8 space-y-3 sm:space-y-6 group hover:border-primary/30 hover:shadow-[0_20px_60px_-20px_rgba(0,163,255,0.08)] transition-all flex flex-col shadow-sm ${glow ? 'border-indigo-500/20 ring-4 ring-indigo-500/5' : ''}`}>
        <div className="flex items-center justify-between">
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-secondary/50 border border-border flex items-center justify-center transition-all group-hover:bg-primary/5 shadow-sm text-muted-foreground/40 group-hover:text-primary">
                {icon}
            </div>
            <div className="h-1.5 w-6 rounded-full bg-secondary group-hover:bg-primary/20 transition-all" />
        </div>
        <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-muted-foreground/40">{label}</p>
            <h3 className="text-xl sm:text-3xl font-bold tracking-tighter uppercase tabular-nums text-foreground group-hover:text-primary transition-colors">{value}</h3>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'UP':
        case 'GOOD':
            return (
                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    Optimal
                </div>
            );
        case 'OK':
            return (
                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    Stable
                </div>
            );
        case 'DEGRADED':
        case 'SLOW':
            return (
                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                    Degraded
                </div>
            );
        case 'DOWN':
            return (
                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border bg-red-500/10 text-red-500 border-red-500/20 animate-pulse-slow shadow-md">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    De-Synced
                </div>
            );
        default:
            return <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">{status}</div>;
    }
};

const getEventIcon = (type: string) => {
    switch (type) {
        case 'DOWN_DETECTED': return '[!]';
        case 'RETRY_FAILED': return '[-]';
        case 'ALERT_SENT': return '[!]';
        case 'RALPH_TRIGGERED': return '[*]';
        case 'RALPH_UPDATE': return '[i]';
        case 'RALPH_ANALYSIS': return '[*]';
        case 'RALPH_LOCALIZATION': return '[?]';
        case 'RALPH_REMEDIATION_SUCCESS': return '[+]';
        case 'RALPH_REMEDIATION_FAILED': return '[x]';
        case 'RALPH_ADVISORY': return '[i]';
        case 'SELF_HEALING_TRIGGERED': return '[*]';
        case 'ROLLBACK_STARTED': return '[<]';
        case 'AI_FIX_GENERATED': return '[+]';
        case 'AI_FIX_APPLIED': return '[+]';
        case 'RECOVERED': return '[+]';
        case 'MANUAL_CHECK': return '[o]';
        case 'USER_APPROVAL_REQUIRED': return '[!]';
        case 'ROLLBACK_SKIPPED': return '[>]';
        case 'ROLLBACK_FAILED': return '[x]';
        default: return '[.]';
    }
};

export default MonitorDetailsPage;
