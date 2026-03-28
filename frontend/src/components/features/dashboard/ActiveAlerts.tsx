import { alerts as mockAlerts } from "@/data/dashboard";
import { AlertCircle, Clock } from "lucide-react";

const ActiveAlerts = ({ alerts }: { alerts?: any[] }) => {
  const displayAlerts = alerts && alerts.length > 0 ? alerts.map(a => ({
    severity: a.severity || "critical",
    message: a.message || `Outage detected on ${a.monitor?.name || 'Monitor'}`,
    time: new Date(a.createdAt).toLocaleTimeString()
  })) : mockAlerts;

  return (
    <div className="glass-card p-5">
      <h3 className="font-semibold text-sm mb-4">Active Alerts</h3>
      <div className="space-y-3">
        {displayAlerts.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No active incidents</p>
          </div>
        )}
        {displayAlerts.map((a, i) => (
          <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
            <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
              a.severity === "critical" ? "bg-destructive animate-pulse" : a.severity === "warning" ? "bg-warning" : "bg-primary"
            }`} />
            <div className="min-w-0">
              <p className="text-xs font-medium leading-relaxed">{a.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {a.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveAlerts;
