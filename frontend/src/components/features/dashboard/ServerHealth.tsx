import { Server } from "lucide-react";
import { serverMetrics } from "@/data/dashboard";

const ServerHealth = () => {
  return (
    <div className="glass-card p-5">
      <h3 className="font-semibold text-sm mb-4">Server Health</h3>
      <div className="space-y-4">
        {serverMetrics.map((s) => (
          <div key={s.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <span className={`status-online text-xs ${s.status === "warning" ? "status-offline" : ""}`}>
                {s.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>CPU</span><span>{s.cpu}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s.cpu > 70 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${s.cpu}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Memory</span><span>{s.memory}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s.memory > 80 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${s.memory}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServerHealth;
