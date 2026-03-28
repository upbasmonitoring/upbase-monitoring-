import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Play, Satellite, Shield, Zap,     Globe, Fingerprint, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingGraphics } from "./BackgroundGraphics";

const RotatingGlobe = lazy(() => import("./RotatingGlobe"));

const GlobeSkeleton = () => (
  <div className="flex-1 w-full aspect-square max-w-[550px] flex items-center justify-center lg:justify-end">
    <Skeleton className="w-[85%] h-[85%] rounded-full opacity-5 bg-slate-200" />
  </div>
);

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-40 bg-white font-sans border-b border-slate-100">
      <FloatingGraphics />
      
      <div className="container relative z-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          
          {/* Left Content: Clear & Realistic Engineering Focus */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm group hover:border-primary/30 transition-all cursor-default"
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
                  className="text-[clamp(2.5rem,10vw,4.5rem)] font-bold uppercase tracking-tighter leading-[0.9] text-slate-900"
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
              className="text-lg md:text-xl text-slate-500 font-semibold uppercase tracking-widest leading-relaxed max-w-xl"
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
                       <span className="text-[10px] font-bold uppercase tracking-[.3em] text-slate-900">Uptime Check Intervals: 30s</span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Used by engineering teams globally</span>
              </div>
            </motion.div>

            {/* Micro Stats: Real Metrics */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-3 gap-12 pt-10 border-t border-slate-100 w-full max-w-lg mt-8"
            >
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Resolution</p>
                    <p className="text-xl font-bold tracking-tighter uppercase text-slate-900/80">30<span className="text-[10px] ml-1">SEC</span></p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Uptime</p>
                    <p className="text-xl font-bold tracking-tighter uppercase text-slate-900/80">99.9<span className="text-[10px] ml-1">%</span></p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Latencies</p>
                    <p className="text-xl font-bold tracking-tighter uppercase text-slate-900/80">Global</p>
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
