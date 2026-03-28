import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { 
    Activity, 
    Globe, 
    Trash2,
    Github,
    RotateCcw,
    Clock,
    Zap,
    History,
    Search,
    Satellite,
    Fingerprint,
    Cpu,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    BarChart,
    ExternalLink,
    Settings2,
    RefreshCcw,
    ShieldCheck,
    CheckCircle2,
    X,
    Pencil
} from "lucide-react";
import { toast } from "sonner";
import {
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

import { useProject } from "@/context/ProjectContext";
import { apiFetch } from "@/lib/api";

const MonitorsPage = () => {
    const { selectedProject } = useProject();
    const queryClient = useQueryClient();
    const [newUrl, setNewUrl] = useState("");
    const [newName, setNewName] = useState("");
    const [successKeyword, setSuccessKeyword] = useState("");
    const [newApiUrl, setNewApiUrl] = useState("");
    const [showGit, setShowGit] = useState(false);
    
    // Git Fields
    const [repoOwner, setRepoOwner] = useState("");
    const [repoName, setRepoName] = useState("");
    const [branch, setBranch] = useState("main");

    const { data: monitors, isLoading } = useQuery({
        queryKey: ["monitors", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return [];
            return await apiFetch(`/monitors?projectId=${selectedProject._id}`);
        },
        refetchInterval: 5000,
        enabled: !!selectedProject?._id
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (!selectedProject?._id) throw new Error("No project selected");
            return await apiFetch(`/monitors`, {
                method: 'POST',
                body: JSON.stringify({
                    ...payload,
                    projectId: selectedProject._id
                })
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["monitors"] });
            toast.success("Monitor initialized successfully");
            setNewUrl("");
            setNewName("");
            setSuccessKeyword("");
            setNewApiUrl("");
            setRepoOwner("");
            setRepoName("");
            setShowGit(false);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to initialize monitor");
        }
    });

    const handleAddMonitor = (e: React.FormEvent) => {
        e.preventDefault();
        
        let url = newUrl.trim().toLowerCase();
        if (!url) {
            toast.error("Endpoint URL required");
            return;
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = `https://${url}`;
        }
        
        let apiUrl = newApiUrl.trim().toLowerCase();
        if (apiUrl && !apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
            apiUrl = `https://${apiUrl}`;
        }
        
        const payload: any = { 
            name: newName || url.replace('https://', ''), 
            url,
            apiUrl: apiUrl || null,
            successKeyword: successKeyword || null 
        };
        
        if (showGit && repoOwner && repoName) {
            payload.githubRepo = {
                owner: repoOwner,
                repo: repoName,
                branch: branch || "main"
            };
        }
        
        createMutation.mutate(payload);
    };

    return (
        <div className="space-y-8 sm:space-y-12 pb-12 sm:pb-20 font-sans">
                
                {/* --- 🚀 1. MONITOR HEADER & ADD FORM --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-12">
                    <div className="space-y-2 sm:space-y-3 lg:max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,163,255,0.4)]" />
                            <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400">Endpoint Management</h2>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-tighter text-slate-900 leading-none">
                            Fleet <span className="text-primary">Monitoring</span>
                        </h1>
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Configure real-time polling for your infrastructure endpoints. 
                            Automatic alerts trigger upon signal degradation.
                        </p>
                    </div>

                    <div className="flex-1 max-w-2xl">
                        <form onSubmit={handleAddMonitor} className="bg-white p-4 sm:p-7 rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)] space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <InputField
                                        id="newName"
                                        label="Monitor Name" 
                                        id="newName"
                                        name="newName"
                                        placeholder="Main API" 
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary/40 transition-all font-sans text-slate-900 placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <InputField
                                        id="newUrl"
                                        label="Target URL" 
                                        id="newUrl"
                                        name="newUrl"
                                        placeholder="api.company.com" 
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary/40 transition-all text-slate-900 placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <InputField
                                        id="successKeyword"
                                        label="Success Keyword" 
                                        id="successKeyword"
                                        name="successKeyword"
                                        placeholder="e.g. 'Dashboard' or 'Login'" 
                                        value={successKeyword}
                                        onChange={(e) => setSuccessKeyword(e.target.value)}
                                        className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary/40 transition-all text-slate-900 placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <InputField
                                        id="apiUrl"
                                        label="Backend Health Check (API)" 
                                        id="apiUrl"
                                        name="apiUrl"
                                        placeholder="api.company.com/api/health" 
                                        value={newApiUrl}
                                        onChange={(e) => setNewApiUrl(e.target.value)}
                                        className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary/40 transition-all text-slate-900 placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                            
                            {showGit && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-500 pt-2 border-t border-slate-50">
                                    <div className="space-y-2">
                                        <InputField
                                        id="repoOwner"
                                        label="Org" 
                                            id="repoOwner"
                                            name="repoOwner"
                                            placeholder="Owner" 
                                            value={repoOwner}
                                            onChange={(e) => setRepoOwner(e.target.value)}
                                            className="bg-slate-50 border-slate-100 h-11 text-[10px] font-bold rounded-xl text-slate-900 placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <InputField
                                        id="repoName"
                                        label="Repo" 
                                            id="repoName"
                                            name="repoName"
                                            placeholder="Repo" 
                                            value={repoName}
                                            onChange={(e) => setRepoName(e.target.value)}
                                            className="bg-slate-50 border-slate-100 h-11 text-[10px] font-bold rounded-xl text-slate-900 placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <InputField
                                        id="branch"
                                        label="Branch" 
                                            id="branch"
                                            name="branch"
                                            placeholder="main" 
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            className="bg-slate-50 border-slate-100 h-11 text-[10px] font-bold rounded-xl text-slate-900 placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-50">
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    onClick={() => setShowGit(!showGit)}
                                    className={`text-[9px] font-bold uppercase tracking-[.25em] gap-3 h-11 sm:h-12 px-5 rounded-2xl transition-all ${showGit ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <Github className="h-4.5 w-4.5" />
                                    {showGit ? 'Remove Git Sync' : 'Add Repository Sync'}
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest h-11 sm:h-12 px-8 text-[10px] rounded-2xl shadow-[0_15px_30px_rgba(0,163,255,0.15)] transition-all">
                                    {createMutation.isPending ? "Connecting..." : "Add Monitor"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* --- 📟 2. MONITOR GRID --- */}
                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-72 rounded-[24px] sm:rounded-[40px] bg-white border border-slate-100 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        {monitors?.map((monitor: any) => (
                            <MonitorDisplayCard key={monitor._id} monitor={monitor} />
                        ))}
                        {monitors?.length === 0 && (
                            <div className="lg:col-span-2 h-[300px] sm:h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[24px] sm:rounded-[50px] bg-white group hover:border-primary/20 transition-all gap-6 sm:gap-8 px-4">
                                <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                    <Satellite className="h-10 w-10" />
                                </div>
                                <div className="text-center space-y-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[.5em] text-slate-400">Station Idle</p>
                                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Awaiting First Endpoint Deployment</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
    );
};

const MonitorDisplayCard = ({ monitor }: { monitor: any }) => {
    const queryClient = useQueryClient();
    const isUp = ["UP", "GOOD", "OK"].includes(monitor.status);
    const isDegraded = ["SLOW", "DEGRADED"].includes(monitor.status);
    const statusBg = isUp ? "bg-emerald-500" : isDegraded ? "bg-amber-500" : "bg-red-500";
    const hasGit = monitor.githubRepo?.owner && monitor.githubRepo?.repo;

    // Edit State Fields
    const [editName, setEditName] = useState(monitor.name);
    const [editUrl, setEditUrl] = useState(monitor.url);
    const [editApiUrl, setEditApiUrl] = useState(monitor.apiUrl || "");
    const [editKeyword, setEditKeyword] = useState(monitor.successKeyword || "");
    const [editFailureKeywords, setEditFailureKeywords] = useState(monitor.failureKeywords?.join(", ") || "");
    const [githubOwner, setGithubOwner] = useState(monitor.githubRepo?.owner || "");
    const [githubRepo, setGithubRepo] = useState(monitor.githubRepo?.repo || "");
    const [githubBranch, setGithubBranch] = useState(monitor.githubRepo?.branch || "main");
    const [isOpen, setIsOpen] = useState(false);

    const { data: logs } = useQuery({
        queryKey: ["monitor-logs", monitor._id],
        queryFn: async () => {
            return await apiFetch(`/monitors/${monitor._id}/logs`);
        },
        refetchInterval: 10000
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => {
            return await apiFetch(`/monitors/${monitor._id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["monitors"] });
            toast.success("Settings Refreshed");
            setIsOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update monitor");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await apiFetch(`/monitors/${monitor._id}`, { method: 'DELETE' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["monitors"] });
            toast.success("Monitor removed");
        }
    });

    const handleUpdate = () => {
        updateMutation.mutate({
            name: editName,
            url: editUrl,
            apiUrl: editApiUrl || null,
            successKeyword: editKeyword || null,
            failureKeywords: editFailureKeywords ? editFailureKeywords.split(",").map(i => i.trim()) : [],
            githubRepo: {
                owner: githubOwner || null,
                repo: githubRepo || null,
                branch: githubBranch || "main"
            }
        });
    };

    return (
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:border-primary/20 transition-all flex flex-col group relative overflow-hidden">
            
            <div className={`absolute left-0 top-18 bottom-18 w-1.5 rounded-full opacity-40 ${statusBg}`} />
            
            <div className="space-y-6 sm:space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
                    <div className="flex gap-4 sm:gap-6 items-center">
                        <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${isUp ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : isDegraded ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-red-50 border-red-100 text-red-500'}`}>
                             {isUp ? <Activity className="h-5 w-5 sm:h-7 sm:w-7" /> : isDegraded ? <Activity className="h-5 w-5 sm:h-7 sm:w-7 text-amber-500" /> : <ShieldAlert className="h-5 w-5 sm:h-7 sm:w-7 animate-pulse" />}
                        </div>
                        <div className="space-y-1.5">
                                <h3 className="text-base sm:text-xl font-bold uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2 sm:gap-3">
                                    <span className="truncate">{monitor.name}</span>
                                {hasGit && <Github className="h-3.5 w-3.5 text-slate-300" />}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{monitor.url.replace('https://', '')}</p>
                        </div>
                    </div>
                    
                    <div className="text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3">
                        <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-bold uppercase tracking-[.15em] sm:tracking-[.25em] border ${
                            monitor.status === 'GOOD' || monitor.status === 'UP' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            monitor.status === 'OK' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            isDegraded ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-red-50 text-red-600 border-red-100 animate-pulse'
                        }`}>
                            {monitor.status === 'GOOD' || monitor.status === 'UP' ? 'Optimal' :
                             monitor.status === 'OK' ? 'Stable' :
                             isDegraded ? 'Degraded' : 'Offline'} Signal
                        </div>
                        {monitor.successKeyword && (
                            <div className="flex items-center gap-2 group/tip">
                                <ShieldCheck className="h-3 w-3 text-primary opacity-40 group-hover/tip:opacity-100 transition-opacity" />
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Content Verified</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-8 pt-4 sm:pt-8 border-t border-slate-50">
                    <div className="space-y-1 sm:space-y-1.5 text-center px-1 sm:px-4">
                        <p className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-400">P95 Latency</p>
                        <p className="text-sm font-bold tracking-tight text-slate-900 tabular-nums">
                            {logs?.p95 > 0 ? `${logs?.p95}ms` : (monitor.responseTime ? `${monitor.responseTime}ms` : "N/A")}
                        </p>
                    </div>
                    <div className="space-y-1 sm:space-y-1.5 text-center px-1 sm:px-4 border-x border-slate-50">
                        <p className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-400">Score</p>
                        <p className="text-sm font-bold tracking-tight text-slate-900 tabular-nums">{monitor.healthScore || 100} PT</p>
                    </div>
                    <div className="space-y-1 sm:space-y-1.5 text-center px-1 sm:px-4">
                        <p className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-400">Signals</p>
                        <p className="text-sm font-bold tracking-tight text-slate-900 tabular-nums">{logs?.totalSamples || 0} <span className="text-[9px] opacity-30 uppercase">Pulse</span></p>
                    </div>
                </div>

                <div className="h-20 sm:h-28 w-full opacity-60 group-hover:opacity-100 transition-all duration-700 bg-slate-50/50 rounded-[16px] sm:rounded-[24px] p-1 sm:p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={logs?.logs || []}>
                            <defs>
                                <linearGradient id={`pulse-${monitor._id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="latency" 
                                    stroke={isUp ? "#10b981" : isDegraded ? "#f59e0b" : "#ef4444"} 
                                    strokeWidth={2.5}
                                    fill={`url(#pulse-${monitor._id})`} 
                                    isAnimationActive={false}
                                />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="pt-4 sm:pt-6 border-t border-slate-50 flex items-center justify-between">
                    <Link to={`/dashboard/monitors/${monitor._id}`} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-all flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-50/50 hover:bg-primary/5 rounded-xl sm:rounded-2xl border border-transparent hover:border-primary/20">
                         Detailed Analytics
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <div className="flex gap-2">
                         {/* Edit Modal Trigger */}
                         <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-slate-100/50 hover:border-primary/30 group/btn shadow-sm bg-white">
                                    <Pencil className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95%] sm:max-w-[520px] bg-white rounded-[32px] sm:rounded-[40px] border-none shadow-2xl p-0 outline-none overflow-hidden">
                                <div className="p-6 sm:p-10">
                                    <DialogHeader className="space-y-4">
                                    <DialogTitle className="text-2xl font-bold uppercase tracking-tighter text-slate-900 flex items-center gap-4 outline-none">
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                            <Settings2 className="h-5 w-5 text-primary" />
                                        </div>
                                        Manage <span className="text-primary">Monitor</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">Modify endpoint credentials or content verification rules.</DialogDescription>
                                </DialogHeader>
                                <div className="py-6 sm:py-8 space-y-6 max-h-[60vh] sm:max-h-none overflow-y-auto px-1 scrollbar-hide">
                                    <div className="space-y-2">
                                        <label htmlFor={`editName-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Friendly Name</label>
                                        <InputField 
                                            id={`editName-${monitor._id}`}
                                            name="name"
                                            value={editName} 
                                            onChange={(e) => setEditName(e.target.value)} 
                                            className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900 placeholder:text-slate-300" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`editUrl-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Endpoint URL</label>
                                        <InputField 
                                            id={`editUrl-${monitor._id}`}
                                            name="url"
                                            value={editUrl} 
                                            onChange={(e) => setEditUrl(e.target.value)} 
                                            className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900 placeholder:text-slate-300" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`editKeyword-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Success Keyword</label>
                                        <InputField 
                                            id={`editKeyword-${monitor._id}`}
                                            name="successKeyword"
                                            placeholder="e.g. 'Digital' or 'Infra'" 
                                            value={editKeyword} 
                                            onChange={(e) => setEditKeyword(e.target.value)} 
                                            className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900 placeholder:text-slate-300" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`editApiUrl-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Backend Health URL</label>
                                        <InputField 
                                            id={`editApiUrl-${monitor._id}`}
                                            name="apiUrl"
                                            placeholder="api.company.com/health" 
                                            value={editApiUrl} 
                                            onChange={(e) => setEditApiUrl(e.target.value)} 
                                            className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900 placeholder:text-slate-300" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`editFailureKeywords-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Custom Failure Rules (Sentinel IQ)</label>
                                        <InputField 
                                            id={`editFailureKeywords-${monitor._id}`}
                                            name="failureKeywords"
                                            placeholder="e.g. maintenance, error, failed" 
                                            value={editFailureKeywords} 
                                            onChange={(e) => setEditFailureKeywords(e.target.value)} 
                                            className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900 placeholder:text-slate-300" 
                                        />
                                        <p className="text-[9px] font-bold text-slate-200 uppercase tracking-widest mt-2 px-1 italic">* Autonomous Hazard Detection: Detects outages even on 200 OK</p>
                                    </div>

                                    {/* Autonomous Logic Section */}
                                    <div className="pt-6 border-t border-slate-50 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                                <Github className="h-3 w-3" />
                                            </div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Autonomous Logic Binding</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor={`githubOwner-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">GitHub Owner</label>
                                                <InputField 
                                                    id={`githubOwner-${monitor._id}`}
                                                    name="githubOwner"
                                                    placeholder="e.g. 'VAISHNAVIDS09-OPS'" 
                                                    value={githubOwner} 
                                                    onChange={(e) => setGithubOwner(e.target.value)} 
                                                    className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor={`githubRepo-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Repo Name</label>
                                                <InputField 
                                                    id={`githubRepo-${monitor._id}`}
                                                    name="githubRepo"
                                                    placeholder="e.g. 'nirmaan'" 
                                                    value={githubRepo} 
                                                    onChange={(e) => setGithubRepo(e.target.value)} 
                                                    className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor={`githubBranch-${monitor._id}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Production Branch</label>
                                            <InputField 
                                                id={`githubBranch-${monitor._id}`}
                                                name="githubBranch"
                                                placeholder="e.g. 'main' or 'master'" 
                                                value={githubBranch} 
                                                onChange={(e) => setGithubBranch(e.target.value)} 
                                                className="bg-slate-50 border-slate-100 h-14 text-xs font-semibold rounded-2xl text-slate-900" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 sm:p-10 pt-0 sm:pt-0 gap-3">
                                    <Button onClick={() => setIsOpen(false)} variant="ghost" className="h-14 flex-1 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-slate-400">Cancel</Button>
                                    <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="h-14 flex-1 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all">
                                        {updateMutation.isPending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4.5 w-4.5 mr-2" />}
                                        Update Node
                                    </Button>
                                </DialogFooter>
                                </div>
                            </DialogContent>
                         </Dialog>

                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-11 w-11 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-slate-100/50 hover:border-red-100 group/del shadow-sm bg-white" 
                            onClick={() => deleteMutation.mutate()}
                          >
                            <Trash2 className="h-4.5 w-4.5 group-hover/del:scale-110 transition-transform" />
                          </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitorsPage;
