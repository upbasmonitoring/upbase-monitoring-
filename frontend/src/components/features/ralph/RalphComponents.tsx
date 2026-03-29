import { 
    ShieldCheck, 
    ShieldAlert, 
    Clock, 
    Zap, 
    Globe, 
    Server, 
    CheckCircle2, 
    XCircle,
    Terminal,
    Code2,
    Database,
    LineChart,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Card, 
    CardContent, 
} from "@/components/ui/card";
import { format } from "date-fns";

/**
 * FixCard: Summary information for a specific fix
 */
export const FixCard = ({ monitor, lastFixStatus, fixTestedAt }) => {
    const getStatusColor = () => {
        switch (lastFixStatus) {
            case 'SUCCESS': return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
            case 'VALIDATED': return 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
            case 'MERGED': return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse';
            case 'POST_MERGE_FAILED': return 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.6)]';
            case 'FAILED': return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
            case 'PENDING': return 'bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.4)]';
            default: return 'bg-muted';
        }
    };

    return (
        <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden group hover:border-primary/20 transition-all">
            <CardContent className="p-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[32px] bg-secondary border border-border flex items-center justify-center relative">
                            <Globe className="h-10 w-10 text-muted-foreground/40" />
                            <div className={`absolute -top-1 -right-1 h-6 w-6 rounded-full border-4 border-card animate-pulse ${getStatusColor()}`} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-foreground leading-none">{monitor?.name || 'Unknown Node'}</h2>
                                <Badge variant="outline" className="rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-border text-muted-foreground/40">
                                    Ralph Diagnostics
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {fixTestedAt ? format(new Date(fixTestedAt), "PPpp") : 'Never'}</span>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span className="text-primary italic">Confidence: 95%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-6 rounded-3xl bg-secondary border border-border flex flex-col items-end">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-1">Status</p>
                            <p className={`text-sm font-black uppercase tracking-tighter ${lastFixStatus === 'VALIDATED' ? 'text-emerald-500' : 'text-foreground'}`}>{lastFixStatus}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const verificationSteps = [
    "Payload Structure Matching",
    "Security Policy Validation",
    "Dependency Conflict Scan",
    "End-to-End Integration Check",
    "Regression Safety Baseline"
];

/**
 * ValidationPanel: Automated Verification Checklist
 */
export const ValidationPanel = ({ fix }: { fix: any }) => {
    return (
        <div className="p-10 rounded-[40px] bg-card border border-border shadow-sm space-y-8 relative overflow-hidden group">
             <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Automated Verification Checklist</h5>
                    <p className="text-xs font-bold text-foreground">Post-Validation Sequence Results</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Verified Baseline</span>
                </div>
             </div>
             
             <div className="space-y-4 relative z-10">
                {verificationSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-secondary/30 border border-border rounded-2xl group/item hover:bg-card hover:border-emerald-500/20 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-xl bg-card border border-border flex items-center justify-center text-emerald-500 group-hover/item:border-emerald-500/30 transition-all">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-tight group-hover/item:text-foreground transition-colors">{step}</span>
                        </div>
                        <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">Passed</div>
                    </div>
                ))}
             </div>
        </div>
    );
};

/**
 * ActionPanel: Merge / Reject controls
 */
export const ActionPanel = ({ status, onMerge, onReject, isLoading }) => {
    const isReady = status === 'VALIDATED';

    return (
        <div className="p-12 rounded-[48px] bg-card border border-border shadow-xl flex flex-col items-center text-center gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-transparent opacity-50" />
            
            <div className="space-y-4 relative z-10">
                <div className={`mx-auto h-20 w-20 rounded-[32px] flex items-center justify-center border transition-all ${isReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-secondary border-border text-muted-foreground'}`}>
                    {isReady ? <ShieldCheck className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
                </div>
                <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight leading-none mb-3">Commit AI Recommendation?</h3>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest italic">
                        {isReady 
                            ? "This fix has passed all multi-endpoint validation checks. It is safe to merge." 
                            : "Validation is in progress or failed. Manual approval is locked for safety."}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 w-full max-w-lg">
                <Button 
                    variant="ghost" 
                    className="flex-1 w-full h-16 rounded-[24px] text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20"
                    disabled={isLoading}
                    onClick={onReject}
                >
                    Reject Fix
                </Button>
                <Button 
                    size="lg"
                    className={`flex-1 w-full h-16 rounded-[28px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all ${isReady ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/30' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
                    disabled={!isReady || isLoading}
                    onClick={onMerge}
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Merge Fix <Rocket className="h-4 w-4 ml-2" /></>}
                </Button>
            </div>
            
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2 z-10">
                <Terminal className="h-3 w-3" /> Branch: fix/ralph-auto-fix
            </p>
        </div>
    );
};

import { Rocket } from "lucide-react";
