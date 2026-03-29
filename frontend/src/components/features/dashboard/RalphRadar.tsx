import * as React from "react";
import { Brain, Cpu, Zap, Activity, ShieldAlert, CheckCircle2, RefreshCcw, Search, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RalphRadarProps {
    monitors: any[]; 
    incidents?: any[];
}

const RalphRadar: React.FC<RalphRadarProps> = ({ monitors, incidents }) => {
    // Filter monitors that are currently in a Ralph Loop
    const activeRalphs = monitors?.filter(m => m.ralphStatus && m.ralphStatus !== 'IDLE') || [];
    
    // Sort incidents to get the most recent events from Ralph
    const ralphEvents = incidents?.flatMap(inc => 
        inc.timeline
            .filter((e: any) => e.type.startsWith('RALPH_'))
            .map((e: any) => ({ ...e, monitorName: inc.monitor?.name || 'Unknown Node' }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400 flex items-center gap-3">
                    <Brain className="h-4 w-4 text-primary" />
                    Ralph Autopilot Radar
                </h3>
                {activeRalphs.length > 0 && (
                    <div className="flex items-center gap-2">
                         <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary italic">Active Analysis</span>
                    </div>
                )}
            </div>

            <div className={`bg-card rounded-[40px] border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-500 ${activeRalphs.length > 0 ? 'border-primary/20 ring-4 ring-primary/5' : ''}`}>
                <div className="p-8 space-y-8">
                    {/* --- 📡 RADAR SCANNER --- */}
                    <div className="relative h-48 w-full bg-slate-900 rounded-[32px] overflow-hidden group">
                        {/* Circular Grid */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <div className="h-24 w-24 border border-slate-500 rounded-full" />
                            <div className="absolute h-40 w-40 border border-slate-500 rounded-full" />
                            <div className="absolute h-64 w-64 border border-slate-500 rounded-full" />
                            <div className="absolute h-full w-[1px] bg-slate-500" />
                            <div className="absolute w-full h-[1px] bg-slate-500" />
                        </div>

                        {/* Scanning Effect - Optimized with x (translateX) */}
                        <motion.div 
                            className="absolute inset-y-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                            style={{ width: '50%' }}
                            animate={{ 
                                x: ['-100%', '300%'],
                            }}
                            transition={{ 
                                duration: 3, 
                                repeat: Infinity, 
                                ease: "linear" 
                            }}
                        />

                        {/* Radar Sweep - Optimized Transform */}
                        <motion.div 
                            className="absolute top-1/2 left-1/2 w-full h-[2px] bg-primary/40 origin-left"
                            style={{ top: '50%', left: '50%', width: '100%' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Detected Nodes (Moving Dots) */}
                        {activeRalphs.map((m, idx) => (
                            <motion.div 
                                key={m._id}
                                className="absolute h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(0,163,255,0.8)] z-20"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8], x: (Math.sin(idx) * 60) + 100, y: (Math.cos(idx) * 40) + 80 }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        ))}

                        {/* Overlay Status */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[.4em]">Signal Resolution</span>
                                <span className="text-2xl font-bold text-white tracking-tighter uppercase tabular-nums">
                                    {activeRalphs.length > 0 ? "INTERCEPTED" : "SCANNING"}
                                </span>
                            </div>
                        </div>

                        {/* Top corner metrics */}
                        <div className="absolute top-6 left-8 flex flex-col gap-1">
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Azimuth 045.2</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Gain +12.4dB</span>
                        </div>
                    </div>

                    {/* --- 🧠 THOUGHT STREAM --- */}
                    <div className="space-y-4">
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Terminal className="h-3 w-3" />
                             Intelligence Thought Stream
                        </h4>
                        
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {ralphEvents.length > 0 ? ralphEvents.map((event, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-4 rounded-2xl bg-secondary/20 border border-border flex gap-4 group hover:border-primary/20 transition-all"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                                            {getRalphEventIcon(event.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[9px] font-bold text-primary uppercase tracking-tighter truncate">{event.monitorName}</span>
                                                <span className="text-[8px] font-semibold text-slate-300 tabular-nums uppercase">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-foreground opacity-80 leading-tight uppercase tracking-tight">{event.message}</p>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center border-2 border-dashed border-border rounded-[32px]">
                                        <div className="h-10 w-10 text-slate-100">
                                            <ShieldAlert className="h-full w-full" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Active Outages</p>
                                            <p className="text-[8px] font-bold text-slate-200 uppercase tracking-widest">PulseWatch is monitoring all nodes</p>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* --- 🚀 ACTIVE RECOVERY STATUS --- */}
                    {activeRalphs.length > 0 && (
                        <div className="pt-2">
                            <div className="p-6 rounded-[28px] bg-primary/5 border border-primary/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic flex items-center gap-2">
                                        <Zap className="h-3 w-3" />
                                        Auto-Pilot Engagement
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Status: {activeRalphs[0].ralphStatus}</span>
                                </div>
                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-primary/10">
                                    <motion.div 
                                        className="h-full bg-primary shadow-[0_0_10px_rgba(0,163,255,0.5)]"
                                        initial={{ width: "10%" }}
                                        animate={{ width: activeRalphs[0].ralphStatus === 'ANALYZING' ? '40%' : activeRalphs[0].ralphStatus === 'REMEDIATING' ? '70%' : '95%' }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-tight leading-relaxed">
                                    Ralph is currently running an autonomous diagnostic loop for <span className="text-foreground">{activeRalphs[0].name}</span>. 
                                    Expected MTTR estimate: <span className="text-primary italic">45s</span>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer Sync */}
                <div className="px-10 py-5 bg-secondary/30 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                         <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Heuristic Engine v1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getRalphEventIcon = (type: string) => {
    switch (type) {
        case 'RALPH_TRIGGERED': return <Zap className="h-4 w-4 text-orange-500" />;
        case 'RALPH_UPDATE': return <Activity className="h-4 w-4 text-blue-500" />;
        case 'RALPH_ANALYSIS': return <Brain className="h-4 w-4 text-purple-500" />;
        case 'RALPH_LOCALIZATION': return <Search className="h-4 w-4 text-indigo-500" />;
        case 'RALPH_REMEDIATION_SUCCESS': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'RALPH_REMEDIATION_FAILED': return <ShieldAlert className="h-4 w-4 text-red-500" />;
        case 'RALPH_ADVISORY': return <Brain className="h-4 w-4 text-primary" />;
        default: return <Zap className="h-4 w-4 text-slate-400" />;
    }
};


export default RalphRadar;
