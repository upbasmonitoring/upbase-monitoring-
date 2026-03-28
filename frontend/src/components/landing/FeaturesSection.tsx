import { motion } from "framer-motion";
import { 
    Zap, 
    Shield, 
    BarChart3, 
    ArrowRight, 
    Activity, 
    Globe, 
    Lock, 
    Cpu,
    Satellite,
    MonitorIcon,
    TerminalSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PerformanceAnimation, SecurityAnimation } from "./FeatureAnimations";

const features = [
    {
        icon: <Activity className="h-6 w-6" />,
        title: "Uptime Monitoring",
        description: "Receive instant notifications via Telegram or Email the second your services go offline. Transparent status reporting for your global infrastructure endpoints.",
        animation: <PerformanceAnimation />,
        color: "blue"
    },
    {
        icon: <Zap className="h-6 w-6" />,
        title: "Incident Tracking",
        description: "Log every failure and performance dip with precision. Correlate downtime with recent changes to identify root causes and improve reliability.",
        animation: <SecurityAnimation />,
        color: "slate"
    }
];

const FeaturesSection = () => {
    return (
        <section id="features" className="py-32 bg-white relative overflow-hidden border-b border-slate-100 font-sans">
            <div className="container relative z-10 px-6">
                
                <div className="max-w-7xl mx-auto">
                    {/* Header: Direct & Clear */}
                    <div className="max-w-3xl mb-32">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="h-0.5 w-10 bg-primary/20" />
                            <span className="text-[10px] font-bold uppercase tracking-[.6em] text-primary">Core Monitoring Tools</span>
                        </motion.div>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-slate-900 leading-[0.9] mb-8"
                        >
                            Powerful <span className="text-primary italic">Visibility</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-500 font-semibold uppercase tracking-widest leading-relaxed"
                        >
                            Practical monitoring features designed for engineers who need clear, real-time data on their website and API availability.
                        </motion.p>
                    </div>

                    {/* Features Matrix */}
                    <div className="grid grid-cols-1 gap-40">
                        {features.map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-24`}
                            >
                                {/* Text Content */}
                                <div className="flex-1 space-y-10">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                                        {feature.icon}
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-4xl font-bold uppercase tracking-tighter text-slate-900 leading-none">
                                            {feature.title}
                                        </h3>
                                        <p className="text-lg text-slate-500 font-semibold uppercase tracking-widest leading-relaxed pr-12">
                                            {feature.description}
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6 pt-6">
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Check Frequency</p>
                                            <p className="text-xl font-bold tracking-tighter text-slate-900">30 SECONDS</p>
                                        </div>
                                        <div className="p-10 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Alerting</p>
                                            <p className="text-xl font-bold tracking-tighter text-slate-900">INSTANT</p>
                                        </div>
                                    </div>

                                    <Link to="/signup">
                                        <Button variant="outline" className="h-12 border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px] rounded-xl px-8 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-4">
                                            Start Monitoring
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>

                                {/* Graphic Content */}
                                <div className="flex-1 w-full aspect-square bg-slate-50/50 rounded-[40px] border border-slate-100 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-slate-100/10 pointer-events-none" />
                                    {feature.animation}
                                    
                                    <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-white/60 px-4 py-2 rounded-2xl border border-slate-100 backdrop-blur-xl z-20">
                                         <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                         <span className="text-[9px] font-bold uppercase tracking-widest text-green-600/80">Active</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
