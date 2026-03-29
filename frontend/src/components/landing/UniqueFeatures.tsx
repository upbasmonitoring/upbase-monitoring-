import { motion } from "framer-motion";
import { 
    Cpu, 
    ShieldCheck, 
    Activity, 
    Database, 
    HardDrive, 
    Share2, 
    Target,
    Zap,
    MessageSquare,
    Webhook,
    Lock
} from "lucide-react";

const specialFeatures = [
    {
        title: "Incident Correlator",
        description: "Automatically link latency spikes and failures to specific deployment events. Trace root-causes across distributed node clusters in seconds.",
        icon: <Target className="h-6 w-6 text-primary" />,
        stat: "99% Accuracy"
    },
    {
        title: "Native Webhook Engine",
        description: "Dispatch payload-rich alerts directly to your backend, Slack, or healing-scripts. Customizable JSON schemas for every node status event.",
        icon: <Webhook className="h-6 w-6 text-cyan-500" />,
        stat: "High-Priority"
    },
    {
        title: "Automated Healing",
        description: "Configure threshold-based remediation logs. Auto-reboot, roll-back, or traffic-reroute the moment a Node heartbeat violates your uptime policy.",
        icon: <HardDrive className="h-6 w-6 text-emerald-500" />,
        stat: "Fail-Safe Alpha"
    },
    {
        title: "Encrypted Node Handshake",
        description: "Zero-knowledge security for all monitoring telemetry. End-to-end encryption from the monitored endpoint to your central dashboard.",
        icon: <Lock className="h-6 w-6 text-amber-500" />,
        stat: "TLS 1.3 Active"
    }
];

const UniqueFeatures = () => {
    return (
        <section id="capabilities" className="py-32 bg-secondary/30 relative overflow-hidden font-sans border-b border-border transition-colors duration-500">
            <div className="container relative z-10 px-6">
                
                <div className="max-w-7xl mx-auto">
                    {/* Header: Authenticity Driven */}
                    <div className="mb-24 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="bg-card px-4 py-2 rounded-2xl border border-border shadow-sm flex items-center gap-3 mb-8"
                        >
                             <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                             <span className="text-[10px] font-bold uppercase tracking-[.5em] text-muted-foreground italic leading-none">High-Availability Protocol v2.4</span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-foreground leading-[0.9] mb-10 max-w-4xl"
                        >
                            Infrastructure <span className="text-primary transition-colors">Forensics</span>
                        </motion.h2>
                        <p className="text-lg md:text-xl text-muted-foreground font-semibold uppercase tracking-widest leading-relaxed max-w-2xl">
                            Specialized tools engineered for deep observability and automated response. Operational data you can trust.
                        </p>
                    </div>

                    {/* Innovation Matrix: Authentic Data Points */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {specialFeatures.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-card p-10 rounded-3xl border border-border hover:border-primary/40 hover:shadow-[0_20px_60px_-15px_rgba(0,163,255,0.1)] transition-all duration-500 flex flex-col"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center mb-8 group-hover:bg-primary/5 transition-colors">
                                    {item.icon}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-2xl font-bold uppercase tracking-tighter text-foreground leading-none group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest italic leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-[.3em] text-primary italic">{item.stat}</span>
                                    <div className="h-1.5 w-8 rounded-full bg-border group-hover:bg-primary/20 transition-all" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Forensic Feed Overlay (Authentic HUD) */}
                    <div className="mt-24 w-full bg-card border border-border rounded-3xl overflow-hidden p-8 relative shadow-sm transition-colors duration-500">
                        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Database className="h-7 w-7" />
                                </div>
                                <div className="text-left">
                                     <p className="text-lg font-bold uppercase tracking-tighter text-foreground">Distributed Node Network</p>
                                     <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground italic">Syncing across 12 Active Latency Points...</p>
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-center md:text-right">
                                     <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">Polling Resolution</p>
                                     <p className="text-xl font-bold tracking-tighter text-primary">30 SEC</p>
                                </div>
                                <div className="text-center md:text-right">
                                     <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">Protocol Handshake</p>
                                     <p className="text-xl font-bold tracking-tighter text-foreground">NATIVE/SDK</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default UniqueFeatures;
