import { motion } from "framer-motion";

export const FloatingGraphics = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-primary/[0.08] rounded-full blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, -60, 0], y: [0, 80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-blue-400/[0.05] rounded-full blur-[180px]"
      />
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)] opacity-[0.4]" />
    </div>
  );
};

export const MonitoringGraphic = () => {
    return <div className="h-4 w-4 bg-primary/20 animate-ping rounded-full" />;
};
