import { useId } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  variant?: "light" | "dark" | "auto" | "vibrant";
  to?: string;
}

const Logo = ({ className = "", size = "md", withText = true, variant = "auto", to }: LogoProps) => {
  const uniqueId = useId().replace(/:/g, ""); // Safe ID for SVG defs
  
  const sizes = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const gaps = {
    sm: "gap-2",
    md: "gap-2.5",
    lg: "gap-4",
  };

  // Improved Adaptive Logic
  const upTextColor = 
    variant === "light" ? "text-white" : 
    variant === "vibrant" ? "text-amber-500" : 
    "text-foreground"; // Changed from text-muted-foreground

  const content = (
    <div className={`flex items-center ${gaps[size]} ${className}`}>
      <motion.div
        className={`${sizes[size]} relative flex items-center justify-center`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Modern Prismatic Icon */}
        <div className="relative w-full h-full group">

          {/* Chromatic Aberration Glow */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-tr from-primary/40 via-purple-500/20 to-cyan-400/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />

          <svg viewBox="0 0 120 120" className="w-full h-full relative z-10 overflow-visible">
            <defs>
              <linearGradient id={`bladeLeft-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
              </linearGradient>
              <linearGradient id={`bladeRight-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Back Facet - The Foundation */}
            <motion.path
              d="M30 40 L90 40 L75 90 L45 90 Z"
              fill="currentColor"
              className="text-primary/20"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Left Prism Blade - "Performance" */}
            <motion.path
              d="M20 20 L65 20 L45 100 L10 100 Z"
              fill={`url(#bladeLeft-${uniqueId})`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Right Prism Blade - "Security" */}
            <motion.path
              d="M100 20 L55 20 L75 100 L110 100 Z"
              fill={`url(#bladeRight-${uniqueId})`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            />

            {/* Intersection Highlight - The "Base" */}
            <motion.path
              d="M55 20 L65 20 L75 60 L65 60 Z"
              fill="white"
              fillOpacity="0.8"
              animate={{
                opacity: [0, 1, 0],
                y: [-10, 80, -10]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Data Stream Edge */}
            <motion.path
              d="M20 20 L65 20"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />

            {/* The Central Nerve Node */}
            <motion.circle
              cx="60" cy="45" r="7"
              className="fill-white drop-shadow-[0_0_8px_white]"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </div>
      </motion.div>

      {withText && (
        <div className="flex flex-col -space-y-1.5 leading-none">
          <motion.div
            className={`${textSizes[size]} flex items-baseline gap-0.5`}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className={`${upTextColor} font-black tracking-tighter text-[1.1em]`}>up</span>
            <span className="text-primary font-black tracking-tight italic">BASE</span>
          </motion.div>

          {size !== "sm" && (
            <div className="hidden lg:flex items-center gap-1.5 pl-0.5">
              <motion.div
                className="h-[1px] bg-primary/30"
                initial={{ width: 0 }}
                animate={{ width: 25 }}
                transition={{ delay: 0.8 }}
              />
              <motion.span
                className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground/40 uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Monitoring
              </motion.span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
