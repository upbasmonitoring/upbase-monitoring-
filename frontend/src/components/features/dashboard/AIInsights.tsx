import { Brain, Sparkles, TrendingUp, AlertCircle } from "lucide-react";

const AIInsights = ({ monitors }: { monitors?: any[] }) => {
  const offlineMonitors = monitors?.filter(m => m.status === 'offline') || [];
  const slowMonitors = monitors?.filter(m => m.responseTime > 500) || [];

  return (
    <div className="glass-card p-6 bg-primary/[0.02] border-primary/10">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        <h3 className="text-lg font-semibold">AI Insights</h3>
      </div>
      <div className="space-y-4">
        {offlineMonitors.length > 0 ? (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Critical Issues Detected</p>
              <p className="text-xs text-muted-foreground">
                {offlineMonitors.length} monitor(s) are currently unreachable. We recommend checking your server logs for the following endpoints: {offlineMonitors.map(m => m.name).join(', ')}.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">System Performance Stable</p>
              <p className="text-xs text-muted-foreground">
                All monitors are performing within expected parameters. Average response time is optimal.
              </p>
            </div>
          </div>
        )}
        
        {slowMonitors.length > 0 && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4 text-warning" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Latency Optimization</p>
              <p className="text-xs text-muted-foreground">
                {slowMonitors.length} endpoint(s) are showing high latency ({">"}500ms). Consider checking database query optimization.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
