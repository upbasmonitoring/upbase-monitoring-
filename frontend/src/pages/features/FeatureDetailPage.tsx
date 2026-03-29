import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from "@/components/landing/Navbar";
import FooterSection from "@/components/landing/FooterSection";
import { motion, AnimatePresence } from "framer-motion";
import { featuresData, FeatureInfo } from "@/data/featuresData";
import { 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight,
  Shield,
  Zap,
  Globe,
  Settings,
  MessageSquare,
  BadgeCheck,
  Activity,
  Server,
  BarChart3,
  BookOpen,
  Info,
  Award,
  Phone,
  ArrowLeft,
  LayoutDashboard,
  Sparkles
} from "lucide-react";
import NotFound from "../NotFound";

/**
 * Icon Mapper - maps string names from data to Lucide components
 */
const IconMapper = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, any> = {
    Activity,
    Server,
    Zap,
    BarChart3,
    BookOpen,
    Globe,
    Shield,
    Info,
    Award,
    Phone
  };
  const IconComponent = icons[name] || Sparkles;
  return <IconComponent className={className} />;
};

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-12">
    <div className="space-y-4">
      <div className="h-4 w-24 bg-secondary rounded" />
      <div className="h-12 w-3/4 bg-secondary rounded-2xl" />
      <div className="h-6 w-1/2 bg-secondary/50 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
      <div className="lg:col-span-2 space-y-12">
        <div className="h-64 bg-secondary/30 rounded-[32px]" />
        <div className="grid grid-cols-2 gap-8">
          <div className="h-48 bg-secondary/30 rounded-2xl" />
          <div className="h-48 bg-secondary/30 rounded-2xl" />
        </div>
      </div>
      <div className="h-[400px] bg-card rounded-[40px] border border-border" />
    </div>
  </div>
);

const FeatureDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const feature = id ? featuresData[id] : null;

  // 1. SEO & Navigation Effects
  useEffect(() => {
    if (feature) {
      // Dynamic Title
      document.title = `${feature.title} | Sentinel IQ`;
      
      // Dynamic Description Meta
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', feature.description);
      } else {
        const meta = document.createElement('meta');
        meta.name = "description";
        meta.content = feature.description;
        document.head.appendChild(meta);
      }
    }
    
    // Smooth Scroll to Top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Simulate loading for polish
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [id, feature]);

  if (!feature && !isLoading) {
    return <NotFound />;
  }

  // 2. Category-based Recommendations
  const relatedFeatures = feature 
    ? Object.entries(featuresData)
        .filter(([key, data]) => key !== id && data.category === feature.category)
        .slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SkeletonLoader />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Task 3 & Nav: Back Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                   <button 
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-muted-foreground/40 hover:text-primary transition-all pr-4"
                  >
                    <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                    Back to previous
                  </button>

                  <nav className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 bg-secondary/30 px-4 py-2 rounded-full border border-border">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground">{feature?.title}</span>
                  </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  {/* LEFT: Main Content (8 cols) */}
                  <div className="lg:col-span-8 space-y-16">
                    <section className="space-y-8">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                         {/* Task 4: Icon Mapping */}
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-secondary/50 border border-border shadow-sm text-[10px] font-black uppercase tracking-widest text-primary shadow-sm hover:scale-[1.02] transition-transform cursor-default">
                          <IconMapper name={feature?.iconName || ''} className="h-3.5 w-3.5" />
                          {feature?.category} capability
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.05]">
                          {feature?.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl italic opacity-80">
                          {feature?.description}
                        </p>
                      </motion.div>

                      {/* How It Works Container */}
                      <div className="relative group p-[2px] rounded-[40px] bg-gradient-to-br from-border via-transparent to-border overflow-hidden mt-12">
                        <div className="bg-card rounded-[38px] p-8 md:p-12 relative z-10 border border-border">
                          <h2 className="text-[12px] font-black uppercase tracking-[.4em] text-primary mb-8 flex items-center gap-3">
                            <Sparkles className="h-4 w-4" />
                            Operational Intelligence
                          </h2>
                          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-medium transition-colors hover:text-foreground">
                            {feature?.howItWorks}
                          </p>
                          <div className="absolute bottom-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                            <IconMapper name={feature?.iconName || ''} className="h-48 w-48 text-primary" />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                       {/* Task 10: Lists Spacing & Hierarchy */}
                      <div className="space-y-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[.4em] text-muted-foreground/60 border-l-4 border-border pl-4">
                          Technical Features
                        </h2>
                        <ul className="space-y-5">
                          {feature?.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-4 group">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <span className="text-foreground/70 font-bold text-[14px]">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[.4em] text-muted-foreground/60 border-l-4 border-emerald-500/40 pl-4">
                          Measurable ROI
                        </h2>
                        <ul className="space-y-5">
                          {feature?.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-4 group relative">
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                              </div>
                              <span className="text-foreground/70 font-bold italic text-[14px]">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  </div>

                  {/* RIGHT: Sidebar (4 cols) */}
                  <div className="lg:col-span-4 space-y-12">
                    <aside className="sticky top-32 space-y-10">
                      
                      {/* Task 8: CTA Polish */}
                      <div className="bg-card rounded-[48px] p-10 text-foreground shadow-[0_48px_80px_-24px_rgba(0,0,0,0.3)] relative overflow-hidden border border-border group">
                        <div className="absolute top-0 right-0 w-full h-[300px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 space-y-8">
                          <div className="space-y-2">
                             <h3 className="text-3xl font-black tracking-tight italic">Scale Securely.</h3>
                             <p className="text-muted-foreground/60 text-sm leading-relaxed font-bold tracking-tight">
                                Deploy {feature?.title} in minutes. Enterprise support available 24/7.
                             </p>
                          </div>
                          
                          <div className="space-y-3">
                            <Link to="/signup" className="block">
                              <button className="w-full bg-primary text-white font-black uppercase tracking-[.15em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-primary/90 active:scale-95 text-[11px] group shadow-xl shadow-primary/20">
                                Start Monitoring
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </Link>
                            
                            <Link to="/dashboard" className="block">
                              <button className="w-full bg-secondary hover:bg-secondary/80 border border-border text-foreground font-black uppercase tracking-[.15em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-[11px]">
                                <LayoutDashboard className="h-4 w-4" />
                                View Dashboard
                              </button>
                            </Link>
                          </div>
                          
                          <div className="pt-4 flex items-center justify-center gap-2 opacity-30">
                            <BadgeCheck className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">SLA Compliant Infrastructure</span>
                          </div>
                        </div>
                      </div>

                      {/* Task 9: Categorized Related Features */}
                      <div className="bg-card rounded-[40px] p-10 border border-border shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] space-y-8">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-primary">
                            In this Category
                          </h4>
                          <p className="text-[12px] font-extrabold text-muted-foreground/60 uppercase tracking-tighter">More {feature?.category}</p>
                        </div>
                        
                        <div className="space-y-3">
                          {relatedFeatures.map(([key, data]) => (
                            <Link 
                              key={key} 
                              to={`/features/${key}`}
                              className="group flex flex-col p-5 rounded-3xl hover:bg-secondary/50 border border-transparent hover:border-border transition-all duration-300"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
                                  {data.title}
                                </span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>
                              <p className="text-[11px] text-muted-foreground/40 font-medium line-clamp-1 italic" title={data.description}>
                                {data.description}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default FeatureDetailPage;
