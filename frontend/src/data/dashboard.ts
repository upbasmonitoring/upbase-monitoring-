import { Activity, Zap, Globe, AlertTriangle } from "lucide-react";

export const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  value: 120 + Math.random() * 80,
}));

export const trafficData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  requests: Math.floor(8000 + Math.random() * 6000),
}));

export const errorData = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}:00`,
  errors: Math.floor(Math.random() * 15),
}));

export const stats = [
  { label: "Uptime", value: "99.98%", change: "+0.02%", up: true, icon: Activity, color: "text-success" },
  { label: "Avg Response", value: "142ms", change: "-8ms", up: true, icon: Zap, color: "text-primary" },
  { label: "Total Requests", value: "2.4M", change: "+12.3%", up: true, icon: Globe, color: "text-primary" },
  { label: "Error Rate", value: "0.02%", change: "-0.01%", up: true, icon: AlertTriangle, color: "text-success" },
];

export const recentLogs = [
  { time: "14:32:05", type: "ERROR", endpoint: "/api/users", status: 500, message: "Internal Server Error" },
  { time: "14:31:42", type: "WARN", endpoint: "/api/auth", status: 429, message: "Rate limit exceeded" },
  { time: "14:31:18", type: "INFO", endpoint: "/api/health", status: 200, message: "OK" },
  { time: "14:30:55", type: "INFO", endpoint: "/api/products", status: 200, message: "OK" },
  { time: "14:30:33", type: "ERROR", endpoint: "/api/payments", status: 502, message: "Bad Gateway" },
];

export const alerts = [
  { severity: "critical", message: "API response time > 2s on /api/checkout", time: "2 min ago" },
  { severity: "warning", message: "SSL certificate expires in 7 days for api.example.com", time: "1 hour ago" },
  { severity: "info", message: "New deployment detected on production", time: "3 hours ago" },
];

export const serverMetrics = [
  { name: "us-east-1", cpu: 42, memory: 67, status: "healthy" },
  { name: "eu-west-1", cpu: 38, memory: 54, status: "healthy" },
  { name: "ap-south-1", cpu: 71, memory: 82, status: "warning" },
];
