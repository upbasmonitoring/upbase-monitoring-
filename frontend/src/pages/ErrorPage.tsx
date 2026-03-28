import { useRouteError, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCcw, ShieldAlert, ArrowLeft, Terminal, Satellite } from "lucide-react";
import Logo from "@/components/common/Logo";

/**
 * 🛰️ upBASE Enterprise Error Boundary
 * A professional, high-trust recovery interface for mission-critical interruptions.
 */
const ErrorPage = () => {
    const error: any = useRouteError();
    const navigate = useNavigate();

    console.error("upBASE System Interruption:", error);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans selection:bg-primary/10 relative overflow-hidden p-8 text-center">
            {/* --- 🌊 BACKGROUND AMBIANCE --- */}
            <div className="absolute inset-0 bg-grid-slate-200/40 opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
            
            <div className="relative z-10 max-w-xl w-full bg-white rounded-[40px] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-12 lg:p-16 group transition-all">
                
                {/* --- 🚀 BRANDING --- */}
                <div className="flex justify-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Logo variant="dark" size="lg" />
                </div>

                {/* --- 🚨 ERROR STATUS --- */}
                <div className="mx-auto w-24 h-24 rounded-[32px] bg-red-50 border border-red-100 flex items-center justify-center mb-10 relative shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 rounded-[32px] bg-red-500/10 animate-ping opacity-20" />
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <div className="absolute -bottom-2 -right-2 h-9 w-9 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg">
                         <ShieldAlert className="h-4.5 w-4.5 text-red-400" />
                    </div>
                </div>

                <div className="space-y-4 mb-12">
                    <h1 className="text-4xl font-bold tracking-tighter uppercase text-slate-900 leading-none">
                        System <span className="text-red-500">Interruption</span>
                    </h1>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">
                        The monitoring engine encountered an unexpected telemetry fault. 
                        Your environment data and configuration remain fully protected.
                    </p>
                </div>

                {/* --- 📟 TELEMETRY LOG --- */}
                <div className="bg-slate-50 rounded-[28px] p-8 mb-12 border border-slate-100 text-left relative overflow-hidden group/log">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Terminal className="h-3.5 w-3.5 text-slate-300" />
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-none">Console Diagnostics</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-red-500/20" />
                    </div>
                    <code className="text-xs font-bold font-mono text-slate-500 block truncate uppercase tracking-tight">
                        {error?.statusText || error?.message || "Internal Engine Error [SE-001]"}
                    </code>
                </div>

                {/* --- 🛠️ RECOVERY CONTROLS --- */}
                <div className="flex flex-col sm:flex-row gap-5">
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[11px] shadow-[0_15px_30px_rgba(0,163,255,0.2)] transition-all active:scale-95"
                    >
                        <RefreshCcw className="h-4.5 w-4.5 mr-3" /> State Reboot
                    </Button>
                    <Button 
                        variant="ghost"
                        onClick={() => navigate("/")} 
                        className="flex-1 h-14 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all border"
                    >
                        <Home className="h-4.5 w-4.5 mr-3 text-slate-400" /> Exit Terminal
                    </Button>
                </div>

                <button 
                  onClick={() => navigate(-1)}
                  className="mt-12 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary transition-all flex items-center justify-center mx-auto gap-3 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Step Back to Safety
                </button>
            </div>
            
            <div className="mt-12 relative z-10 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-slate-100 shadow-sm">
                    <Satellite className="h-3.5 w-3.5 text-primary opacity-20" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                        upBASE • Sentinel Station V2.4
                    </p>
                 </div>
            </div>
        </div>
    );
};

export default ErrorPage;
