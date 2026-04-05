import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Play, Satellite, Shield, Zap,     Globe, Fingerprint, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, lazy, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingGraphics } from "./BackgroundGraphics";

// 🚀 Aggressive Pre-fetching: Initiate network request for heavy 3D engine 
// the instant this code is parsed, skipping React's render-blocking lifecycle!
const GlobePromise = import("./RotatingGlobe");
const RotatingGlobe = lazy(() => GlobePromise);

const GlobeSkeleton = () => (
    <div className="flex-1 w-full aspect-square max-w-[550px] flex items-center justify-center lg:justify-end relative">
      {/* Outer Pulse */}
      <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_3s_infinite]" />
      <div className="absolute inset-[15%] rounded-full border border-primary/20 animate-[ping_4s_infinite]" />
      
      {/* Spinning Scanning Ring */}
      <div className="absolute inset-0 rounded-full border-t-2 border-primary/40 animate-spin transition-opacity duration-1000" />
      
      {/* Inner Hub */}
      <div className="w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-primary/5 via-primary/10 to-transparent border border-primary/10 relative flex items-center justify-center">
           <Satellite className="h-10 w-10 text-primary/30 animate-pulse" />
           <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-[0.05] pointer-events-none">
                {[...Array(16)].map((_, i) => (
                    <div key={i} className="border-[0.5px] border-primary" />
                ))}
           </div>
      </div>
      
      <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-3">
           <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
           <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/50">Establishing Uplink...</span>
      </div>
    </div>
);

const HeroSection = () => {
  const [stats, setStats] = useState({
    resolution: "30",
    uptime: "99.96",
    monitors: "12K+"
  });

  useEffect(() => {
    // ⚡ SUPER-FAST FETCH: Pulls directly from Redis RAM (averts any MongoDB hit latency)
    const apiUrl = import.meta.env.VITE_API_URL || '';
    fetch(`${apiUrl}/api/public/landing-stats`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setStats({
            resolution: res.data.resolutionTimeAvg || "30",
            uptime: res.data.globalUptime || "99.96",
            monitors: Math.floor(res.data.activeMonitors / 1000) + "K+"
          });
        }
      })
      .catch(() => {}); // SILENT catch, fallback safely if network fails
  }, []);

  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-40 bg-background text-foreground font-sans border-b border-border transition-colors duration-500">
      <FloatingGraphics />
      
      <div className="container relative z-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          
          {/* Left Content: Clear & Realistic Engineering Focus */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-secondary/50 border border-border shadow-sm group hover:border-primary/30 transition-all cursor-default"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-500">v2.4 Stable Deployment</span>
              <ChevronRight className="h-3 w-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </motion.div>

            <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: "circOut" }}
                  className="text-[clamp(2.5rem,10vw,4.5rem)] font-bold uppercase tracking-tighter leading-[0.9] text-foreground"
                >
                  Reliable <br /> 
                  <span className="text-primary">Uptime</span> <br /> 
                  Monitoring
                </motion.h1>
                <div className="h-0.5 w-16 bg-primary/20 rounded-full" />
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground font-semibold uppercase tracking-widest leading-relaxed max-w-xl"
            >
              Monitor your website and API health with real-time incident alerting and performance tracking. Integrated uptime reporting you can trust.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto"
            >
              <Link to="/signup" className="w-full sm:w-auto group">
                <Button className="w-full sm:w-auto h-16 px-12 text-[12px] font-bold uppercase tracking-[.25em] rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-[0_20px_40px_rgba(0,163,255,0.15)] group-hover:-translate-y-1 transition-all active:scale-95">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-4 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              
              <div className="flex flex-col items-center sm:items-start opacity-70 hover:opacity-100 transition-opacity cursor-default">
                  <div className="flex items-center gap-3 mb-1">
                       <Activity className="h-4 w-4 text-primary" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground transition-colors">Uptime Check Intervals: {stats.resolution}s</span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Used by engineering teams globally</span>
              </div>
            </motion.div>

            {/* Micro Stats: Real Metrics powered by Redis */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-3 gap-12 pt-10 border-t border-border w-full max-w-lg mt-8"
            >
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Resolution</p>
                    <p className="text-xl font-bold tracking-tighter uppercase text-foreground/80">{stats.resolution}<span className="text-[10px] ml-1">SEC</span></p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Global Uptime</p>
                    <p className="text-xl font-bold tracking-tighter uppercase text-foreground/80">{stats.uptime}<span className="text-[10px] ml-1">%</span></p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Monitors</p>
                    <p className="text-xl font-bold tracking-tighter uppercase text-foreground/80">{stats.monitors}</p>
                </div>
            </motion.div>
          </div>

          {/* Right Graphic: Clean & Clear */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="flex-1 w-full flex justify-center lg:justify-end relative group px-6 sm:px-0"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] opacity-10" />
            <div className="relative z-10 w-full max-w-[550px] aspect-square">
                <Suspense fallback={<GlobeSkeleton />}>
                  <RotatingGlobe />
                </Suspense>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
