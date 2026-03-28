import { Activity, Zap, Shield, Globe, BarChart3, Bell, Brain, MousePointer2, Lock } from "lucide-react";

export const features = [
  { icon: Activity, title: "Precision Uptime", desc: "Track availability across all your services with 30-second checks from global locations." },
  { icon: Brain, title: "AI-Powered Diagnostics", desc: "Our AI Detective analyzes outages in real-time to provide immediate root-cause analysis." },
  { icon: Shield, title: "Infrastructure Security", desc: "Automated header auditing and security vulnerability scanning on every uptime check." },
  { icon: MousePointer2, title: "Synthetic Workflows", desc: "Simulate complex user journeys like login and checkout to verify core business logic." },
  { icon: BarChart3, title: "Production Analytics", desc: "Deep visibility into error rates, server health, and API response distributions." },
  { icon: Bell, title: "Intelligent Alerting", desc: "Smart escalation policies via Slack, PagerDuty, and custom webhooks with deduplication." },
];

export const integrations = ["AWS", "Vercel", "DigitalOcean", "Docker", "Kubernetes", "GitHub", "Slack", "PagerDuty", "Discord"];

export const plans = [
  { name: "Free", price: "$0", period: "/mo", desc: "For developers & side projects", features: ["10 monitors", "1-min checks", "Email alerts", "30-day history", "Basic security checks"], cta: "Sign Up Free" },
  { name: "Professional", price: "$49", period: "/mo", desc: "For scaling applications", features: ["100 monitors", "30-sec checks", "Slack & AI Analysis", "90-day history", "Synthetic workflows", "Unlimited teams"], cta: "Start 14-day Trial", popular: true },
  { name: "Global Enterprise", price: "Custom", period: "", desc: "Mission-critical infrastructure", features: ["1000+ monitors", "10-sec checks", "White-glove setup", "3-year data retention", "Premium security auditing", "Dedicated engineer"], cta: "Contact Sales" },
];
