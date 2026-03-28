import { useState } from "react";
import { BrainCircuit, Sparkles, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AIInsightButtonProps {
  log: any;
}

const AIInsightButton = ({ log }: AIInsightButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!log.aiAnalysis) return null;

  return (
    <>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-6 px-2 text-[10px] gap-1 bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <BrainCircuit className="h-3 w-3" /> AI Insight
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] border-primary/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" /> AI Root Cause Analysis
            </DialogTitle>
            <DialogDescription>
              Technical diagnosis for {log.monitor?.name} outage
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Info className="h-3 w-3" /> Technical Root Cause
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {log.aiAnalysis.rootCause}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-success/5 border border-success/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-success uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Recommended Action
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                {log.aiAnalysis.remediation}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Complexity</p>
                  <Badge variant="outline" className="mt-1 border-primary/30 text-primary">
                    {log.aiAnalysis.estimatedComplexity}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIInsightButton;
