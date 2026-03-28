import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { trafficData as defaultData } from "@/data/dashboard";

const TrafficChart = ({ monitors }: { monitors?: any[] }) => {
  const displayData = monitors ? monitors.map(m => ({
    time: m.name,
    requests: m.status === 'online' ? Math.floor(Math.random() * 1000) : 0
  })) : defaultData;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Traffic Analytics</h3>
        <span className="text-xs text-muted-foreground">Current Load</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
          <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrafficChart;
