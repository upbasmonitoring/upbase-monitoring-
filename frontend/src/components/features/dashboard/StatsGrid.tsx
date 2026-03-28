import { ArrowUp, ArrowDown, Activity, Zap, Globe, AlertTriangle } from "lucide-react";
import { stats as defaultStats } from "@/data/dashboard";

const iconMap: Record<string, any> = {
  Activity, Zap, Globe, AlertTriangle
};

const StatsGrid = ({ customStats }: { customStats?: any[] }) => {
  const displayStats = customStats || defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayStats.map((s: any) => {
        const Icon = typeof s.icon === 'string' ? iconMap[s.icon] : s.icon;
        return (
          <div key={s.label} className="glass-card-hover p-5 flex flex-col">
            <header className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              {Icon && <Icon className={`h-4 w-4 ${s.color}`} />}
            </header>
            <strong className="text-2xl font-bold">{s.value}</strong>
            <footer className="flex items-center gap-1 mt-auto pt-1 text-xs">
              {s.up ? <ArrowUp className="h-3 w-3 text-success" /> : <ArrowDown className="h-3 w-3 text-destructive" />}
              <span className="text-success font-medium">{s.change}</span>
              <span className="text-muted-foreground ml-1">vs last 24h</span>
            </footer>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
