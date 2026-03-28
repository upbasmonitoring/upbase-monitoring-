import { Mail, MessageSquare, Webhook, Bell } from "lucide-react";

export const alertRules = [
  { id: 1, name: "High Response Time", condition: "Response time > 2000ms", monitor: "api.example.com", channel: "Slack + Email", status: "active" },
  { id: 2, name: "Downtime Alert", condition: "Status != 200 for 2 checks", monitor: "All monitors", channel: "Email + Webhook", status: "active" },
  { id: 3, name: "Error Rate Spike", condition: "Error rate > 5% in 5min", monitor: "All monitors", channel: "Slack", status: "active" },
  { id: 4, name: "SSL Expiry Warning", condition: "SSL expires in < 14 days", monitor: "All monitors", channel: "Email", status: "paused" },
];

export const alertHistory = [
  { id: 1, rule: "High Response Time", status: "resolved", triggered: "2026-03-11 14:20:00", resolved: "2026-03-11 14:25:00", duration: "5m" },
  { id: 2, rule: "Downtime Alert", status: "active", triggered: "2026-03-11 14:15:00", resolved: null, duration: "17m" },
  { id: 3, rule: "Error Rate Spike", status: "resolved", triggered: "2026-03-12 12:30:00", resolved: "2026-03-12 12:45:00", duration: "15m" },
  { id: 4, rule: "High Response Time", status: "resolved", triggered: "2026-03-12 10:00:00", resolved: "2026-03-12 10:03:00", duration: "3m" },
  { id: 5, rule: "Downtime Alert", status: "resolved", triggered: "2026-03-11 22:10:00", resolved: "2026-03-11 22:12:00", duration: "2m" },
];

export const channels = [
  { icon: Mail, name: "Email", desc: "team@company.com", connected: true },
  { icon: MessageSquare, name: "Slack", desc: "#monitoring-alerts", connected: true },
  { icon: Webhook, name: "Webhook", desc: "https://hooks.company.com/alerts", connected: true },
  { icon: Bell, name: "PagerDuty", desc: "Not configured", connected: false },
];
