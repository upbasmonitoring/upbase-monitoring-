import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { errorData } from "@/data/dashboard";

const ErrorRateChart = ({ monitors }: { monitors?: any[] }) => {
  const offlineCount = monitors?.filter(m => m.status === 'offline').length || 0;
  
  // Real logic would be historical, here we'll map the current snapshot to the chart for demo
  const displayData = monitors && monitors.length > 0 ? Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}:00`,
    errors: i === 11 ? offlineCount : Math.floor(Math.random() * (offlineCount + 2))
  })) : errorData;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Error Rate</h3>
        <span className="text-xs text-muted-foreground">Last 24h</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220, 13%, 91%)", fontSize: "12px" }} />
          <Line type="monotone" dataKey="errors" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ErrorRateChart;
