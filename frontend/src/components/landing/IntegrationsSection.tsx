import { motion } from "framer-motion";
import { 
    Cloud, 
    Database, 
    Globe, 
    Zap, 
    Shield, 
    Activity, 
    Cpu, 
    Satellite,
    Monitor,
    Terminal,
    Webhook,
    MessageSquare
} from "lucide-react";

const integrations = [
    { name: "Native SDK", desc: "Integrate monitoring at the code level with our JavaScript, Python, and Go SDKs. Zero-impact telemetry for every node heartbeat.", icon: <Terminal className="h-6 w-6" /> },
    { name: "Global Webhooks", desc: "Dispatch JSON-rich incidents to your existing infrastructure. Real-time alerting with support for custom retry and healing logic.", icon: <Webhook className="h-6 w-6" /> },
    { name: "Cloud Sync", desc: "Native support for AWS, Vercel, and Render deployments. Track cross-platform health within a single unified control plane.", icon: <Cloud className="h-6 w-6" /> },
    { name: "Uptime Clusters", desc: "Monitor multi-region endpoint health with distributed polling. Verified status reports from 12+ global latency points.", icon: <Globe className="h-6 w-6" /> }
];

const IntegrationsSection = () => {
    return (
        <section id="integrations" className="py-32 bg-white relative overflow-hidden border-b border-slate-100 font-sans">
            <div className="container relative z-10 px-6">
                
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
                    
                    {/* Left: Authentic Connectivity */}
                    <div className="flex-1 space-y-12">
                        <div className="space-y-6">
                             <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 mb-4"
                            >
                                <div className="h-px w-8 bg-primary/20" />
                                <span className="text-[10px] font-bold uppercase tracking-[.6em] text-slate-500">Native Endpoint Sync</span>
                            </motion.div>
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-slate-900 leading-[0.9]"
                            >
                                Fleet <br /> <span className="text-primary">Connectivity</span>
                            </motion.h2>
                            <p className="text-lg md:text-xl text-slate-500 font-semibold uppercase tracking-widest leading-relaxed pr-12">
                                Native status reporting and incident dispatching via SDK or Webhook. Synchronize your entire infrastructure health into a single unified dashboard.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                            {integrations.map((item, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="space-y-4 group"
                                >
                                    <div className="flex items-center gap-4 text-primary">
                                         <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_10px_30px_-10px_rgba(0,163,255,0.4)] transition-all">
                                            {item.icon}
                                         </div>
                                         <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{item.name}</h3>
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 italic leading-relaxed group-hover:text-slate-500 transition-colors">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Authentic Network Visualization (Clean Grid) */}
                    <div className="flex-1 w-full max-w-[650px] aspect-[4/3] bg-slate-50 rounded-[40px] border border-slate-200 overflow-hidden relative shadow-sm">
                        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-[0.05] pointer-events-none">
                            {[...Array(64)].map((_, i) => (
                                <div key={i} className="border-[0.5px] border-slate-900" />
                            ))}
                        </div>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                             {/* Central Control Unit */}
                             <motion.div
                                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="h-32 w-32 bg-white rounded-3xl border border-slate-200 shadow-2xl flex items-center justify-center relative z-20"
                             >
                                 <Satellite className="h-12 w-12 text-primary animate-pulse" />
                             </motion.div>

                             {/* Status Data Points */}
                             <div className="absolute inset-0">
                                 <StatusBadge x="25%" y="25%" status="Healthy" label="London-01" />
                                 <StatusBadge x="75%" y="20%" status="Monitoring" label="US-East-2" />
                                 <StatusBadge x="15%" y="70%" status="Healing" label="Singapore" />
                                 <StatusBadge x="85%" y="75%" status="Critical" label="Mumbai-01" color="text-red-500" />
                                 <StatusBadge x="50%" y="85%" status="Syncing" label="Tokyo-Edge" />
                             </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

const StatusBadge = ({ x, y, status, label, color = "text-green-500" }: any) => (
    <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)" }}
        className="flex flex-col items-center gap-2"
    >
        <div className="h-4 w-4 rounded-full bg-white border border-slate-200 shadow-xl flex items-center justify-center">
             <div className={`h-1.5 w-1.5 rounded-full bg-current ${color} animate-pulse`} />
        </div>
        <div className="bg-white/80 backdrop-blur-xl px-4 py-1.5 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
             <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</span>
             <span className={`text-[8px] font-black uppercase tracking-widest ${color}`}>{status}</span>
        </div>
    </motion.div>
);

export default IntegrationsSection;
