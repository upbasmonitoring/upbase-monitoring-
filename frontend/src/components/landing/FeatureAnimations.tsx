import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "../common/Logo";
import { 
  BarChart3, 
  LineChart, 
  Shield, 
  Lock, 
  Globe, 
  Cloud, 
  Server, 
  Activity,
  User,
  Building,
  Home,
  Package,
  Activity as PulseIcon
} from "lucide-react";

export const PerformanceAnimation = () => {
  return (
    <div 
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}
      className="relative w-full h-full rounded-2xl overflow-hidden p-8 font-sans border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
    >
      {/* Header HUD */}
      <div className="flex justify-between items-center mb-8 relative z-20">
        <div className="flex items-center gap-4">
           <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <PulseIcon className="h-4 w-4 text-primary" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Telemetry stream 0x1</p>
        </div>
        <div className="flex gap-2">
          <div className="h-1.5 w-8 rounded-full bg-primary/20" />
          <div className="h-1.5 w-4 rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-[0.03] pointer-events-none">
        {[...Array(144)].map((_, i) => (
          <div key={i} className="border-[0.5px] border-slate-900" />
        ))}
      </div>

      {/* Bar Chart Area */}
      <div className="relative h-20 flex items-end gap-1.5 mb-8 z-10 px-2">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: "20%" }}
            animate={{ height: [`${30 + Math.random() * 50}%`, `${40 + Math.random() * 40}%`, `${30 + Math.random() * 50}%`] }}
            transition={{ duration: 1.5 + Math.random() * 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ 
              background: 'linear-gradient(to top, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.6))'
            }}
            className="flex-1 rounded-t-sm"
          />
        ))}
        
        {/* Real-time Dynamic Tooltip Badge */}
        <motion.div
            animate={{ x: [0, 40, 0], y: [-40, -60, -40] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/4 px-4 py-2 bg-white/90 border border-primary/20 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-0.5"
        >
            <span className="text-[8px] font-black uppercase tracking-[.3em] text-slate-500 italic">Latency</span>
            <span className="text-sm font-black italic tracking-tighter text-primary">124ms</span>
        </motion.div>
      </div>

      {/* Line Chart Area */}
      <div className="relative h-16 z-0 overflow-visible mt-2">
        <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
          <motion.path
            d="M 0 80 Q 50 20 100 70 T 200 40 T 300 60 T 400 20"
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.path
            d="M 0 90 Q 50 50 100 80 T 200 60 T 300 90 T 400 50"
            fill="none"
            stroke="rgba(59, 130, 246, 0.1)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />
        </svg>
      </div>

      {/* Bottom Forensic Stats */}
      <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-8 mt-4 relative z-20">
        <div className="space-y-1">
          <p className="text-slate-400 uppercase text-[8px] font-black tracking-widest italic leading-none">Request Rate</p>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-slate-900 font-black italic text-base tracking-tighter">479K</span>
            <span className="text-green-500 text-[8px] font-bold">+12%</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-slate-400 uppercase text-[8px] font-black tracking-widest italic leading-none">Response</p>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-slate-900 font-black italic text-base tracking-tighter">117ms</span>
            <span className="text-green-500 text-[8px] font-bold">-4ms</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-slate-400 uppercase text-[8px] font-black tracking-widest italic leading-none">Stability</p>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-slate-900 font-black italic text-base tracking-tighter">99.9%</span>
            <span className="text-slate-400 text-[8px] font-bold">Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SecurityAnimation = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100">
      {/* Mesh/Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] rotate-12 scale-150">
        <svg width="100%" height="100%">
          <pattern id="sec-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#sec-grid)" />
        </svg>
      </div>

      {/* Central Cloud */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20 h-32 w-32 md:h-48 md:w-48 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100"
      >
        <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl" />
        <Cloud className="h-16 w-16 md:h-24 md:w-24 text-primary" />
        
        {/* Orbiting Shields */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-40px] border-[1px] border-dashed border-primary/20 rounded-full"
        >
          <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 p-2 bg-white rounded-full shadow-lg border border-slate-100">
            <Shield className="h-4 w-4 text-primary" />
          </motion.div>
          <motion.div className="absolute bottom-0 left-1/2 -translate-x-1/2 p-2 bg-white rounded-full shadow-lg border border-slate-100">
            <Lock className="h-4 w-4 text-primary" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Surrounding Nodes */}
      <div className="absolute inset-0 z-10">
        <Node icon={<User className="h-5 w-5" />} label="Identity" x="20%" y="20%" delay={0} />
        <Node icon={<Globe className="h-5 w-5" />} label="Globe" x="80%" y="30%" delay={1} />
        <Node icon={<Building className="h-5 w-5" />} label="Enterprise" x="15%" y="65%" delay={2} />
        <Node icon={<Home className="h-5 w-5" />} label="Remote" x="85%" y="70%" delay={3} />
        <Node icon={<Package className="h-5 w-5" />} label="Assets" x="50%" y="85%" delay={4} />
      </div>

      {/* Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
        <Connection x1="20%" y1="20%" x2="50%" y2="50%" />
        <Connection x1="80%" y1="30%" x2="50%" y2="50%" />
        <Connection x1="15%" y1="65%" x2="50%" y2="50%" />
        <Connection x1="85%" y1="70%" x2="50%" y2="50%" />
        <Connection x1="50%" y1="85%" x2="50%" y2="50%" />
      </svg>
    </div>
  );
};

const Node = ({ icon, x, y, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    animate={{ y: [0, -5, 0] }}
    transition={{ delay, duration: 4, repeat: Infinity, ease: "easeInOut" }}
    style={{ left: x, top: y, position: "absolute", transform: "translate(-50%, -50%)" }}
    className="p-3 bg-white rounded-2xl shadow-lg border border-slate-100 text-primary"
  >
    {icon}
  </motion.div>
);

const Connection = ({ x1, y1, x2, y2 }: any) => (
  <motion.line
    x1={x1} y1={y1} x2={x2} y2={y2}
    stroke="url(#grad1)"
    strokeWidth="2"
    strokeDasharray="5,5"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  >
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0 }} />
      </linearGradient>
    </defs>
  </motion.line>
);
