import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

export const PremiumLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="relative z-10 p-5 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <Brain className="w-12 h-12 text-primary animate-pulse" />
        </div>
        
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary animate-spin" style={{ margin: '-10px' }} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-10 flex flex-col items-center gap-2"
      >
        <h2 className="text-sm font-black text-slate-100 uppercase tracking-[.3em] ml-[.3em]">Ralph Intelligence</h2>
        <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1 w-1 rounded-full bg-primary/40 animate-bounce" />
        </div>
      </motion.div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
            {/* Sidebar Skeleton (Matching 280px width) */}
            <aside className="hidden lg:flex w-[280px] flex-col shrink-0 border-r border-border bg-card relative">
                <div className="h-20 flex items-center px-8 border-b border-border/50 shrink-0">
                    <div className="h-8 w-32 bg-secondary rounded-lg animate-pulse" />
                </div>
                <div className="px-5 py-8 space-y-4 flex-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-12 w-full bg-secondary/40 rounded-2xl animate-pulse" />
                    ))}
                </div>
                <div className="p-5 border-t border-border/50">
                    <div className="h-16 w-full bg-secondary/40 rounded-2xl animate-pulse" />
                </div>
            </aside>

            {/* Content Area Skeleton */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header Header (Matching sm:h-20) */}
                <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-transparent">
                    <div className="flex items-center gap-6">
                        <div className="h-10 w-48 bg-secondary/60 rounded-2xl animate-pulse" />
                        <div className="hidden md:block h-10 w-64 bg-secondary/40 rounded-2xl animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-card border border-border animate-pulse" />
                        <div className="h-11 w-11 rounded-2xl bg-card border border-border animate-pulse" />
                    </div>
                </div>

                {/* Main Body Skeleton (Matching padding) */}
                <main className="flex-1 px-4 sm:px-6 lg:px-12 py-4 sm:py-8 overflow-hidden">
                    <div className="max-w-[1400px] mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-3">
                                <div className="h-10 w-64 bg-secondary/80 rounded-xl animate-pulse" />
                                <div className="h-4 w-96 bg-secondary/40 rounded-md animate-pulse" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-44 bg-card border border-border rounded-3xl animate-pulse shadow-sm" />
                            ))}
                        </div>

                        <div className="h-[500px] bg-card border border-border rounded-[32px] animate-pulse shadow-sm" />
                    </div>
                </main>
            </div>
        </div>
    );
};
