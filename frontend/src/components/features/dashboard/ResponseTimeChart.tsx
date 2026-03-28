import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { responseTimeData as defaultData } from "@/data/dashboard";

const ResponseTimeChart = ({ monitors }: { monitors?: any[] }) => {
  // If we have real monitors, use their current state
  const displayData = monitors ? monitors.map(m => ({
    name: m.name,
    value: m.responseTime
  })) : defaultData;

  return (
    <div className="glass-card p-6 h-[350px]">
      <div className="flex flex-col mb-6">
        <h3 className="text-lg font-semibold">Average Response Time</h3>
        <p className="text-sm text-muted-foreground">Performance across your network</p>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey={monitors ? "name" : "time"} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey={monitors ? "value" : "value"} 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResponseTimeChart;
