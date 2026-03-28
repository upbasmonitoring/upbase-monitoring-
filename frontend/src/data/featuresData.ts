export interface FeatureInfo {
  title: string;
  description: string;
  features: string[];
  howItWorks: string;
  benefits: string[];
  category: "product" | "resources" | "company";
  iconName: string;
}

export const featuresData: Record<string, FeatureInfo> = {
  "incident-correlation": {
    "title": "Incident Correlation",
    "description": "Identify the root cause of issues by correlating logs, metrics, and system events in real-time.",
    "features": [
      "Unified view of logs, metrics, and alerts",
      "Automatic anomaly detection",
      "AI-powered root cause suggestions",
      "Timeline-based incident tracking"
    ],
    "howItWorks": "Sentinel IQ collects logs and performance metrics from your services and uses AI to correlate related events, helping you quickly identify the origin of failures.",
    "benefits": [
      "Faster debugging",
      "Reduced downtime",
      "Clear visibility into system failures"
    ],
    "category": "product",
    "iconName": "Activity"
  },
  "fleet-monitoring": {
    "title": "Fleet Monitoring",
    "description": "Monitor multiple services, APIs, and infrastructure endpoints from a centralized dashboard.",
    "features": [
      "Multi-endpoint monitoring",
      "Real-time uptime tracking",
      "Latency measurement (p50, p95)",
      "Global monitoring support"
    ],
    "howItWorks": "The system continuously checks your services from multiple nodes and records uptime, latency, and failures.",
    "benefits": [
      "Centralized monitoring",
      "Improved reliability",
      "Real-time performance insights"
    ],
    "category": "product",
    "iconName": "Server"
  },
  "automated-healing": {
    "title": "Automated Healing",
    "description": "Automatically recover from failures using intelligent recovery workflows.",
    "features": [
      "Auto-restart failed services",
      "Trigger recovery scripts",
      "Smart retry mechanisms",
      "Integration with deployment systems"
    ],
    "howItWorks": "When a failure is detected, Sentinel IQ triggers predefined recovery actions to restore system stability.",
    "benefits": [
      "Reduced manual intervention",
      "Faster recovery",
      "Improved uptime"
    ],
    "category": "product",
    "iconName": "Zap"
  },
  "status-dashboard": {
    "title": "Status Dashboard",
    "description": "Real-time overview of system health, uptime, and performance metrics.",
    "features": [
      "Live system status",
      "Latency visualization",
      "Incident history",
      "Service availability tracking"
    ],
    "howItWorks": "Data from monitoring systems is aggregated and displayed in a clean dashboard for instant visibility.",
    "benefits": [
      "Quick health checks",
      "Better decision making",
      "Improved transparency"
    ],
    "category": "product",
    "iconName": "BarChart3"
  },
  "api-documentation": {
    "title": "API Documentation",
    "description": "Comprehensive guides to integrate monitoring, alerts, and AI diagnostics into your system.",
    "features": [
      "REST API integration",
      "Authentication via API keys",
      "Monitoring endpoints setup",
      "Webhook support"
    ],
    "howItWorks": "Developers can use the provided APIs to send data and receive monitoring insights programmatically.",
    "benefits": [
      "Easy integration",
      "Automation support",
      "Developer-friendly system"
    ],
    "category": "resources",
    "iconName": "BookOpen"
  },
  "uptime-clusters": {
    "title": "Uptime Clusters",
    "description": "Distributed monitoring nodes ensure reliable uptime tracking across different regions.",
    "features": [
      "Multi-region checks",
      "Failover detection",
      "Redundant monitoring nodes",
      "Accurate uptime calculation"
    ],
    "howItWorks": "Multiple nodes across regions monitor your services to ensure accurate uptime reporting.",
    "benefits": [
      "High reliability",
      "Accurate monitoring",
      "Reduced false alerts"
    ],
    "category": "resources",
    "iconName": "Globe"
  },
  "network-status": {
    "title": "Network Status",
    "description": "Live status page displaying current system availability and past incidents.",
    "features": [
      "Public status page",
      "Incident timeline",
      "Downtime reporting",
      "Historical insights"
    ],
    "howItWorks": "System events are logged and displayed in a transparent status page for users.",
    "benefits": [
      "User transparency",
      "Trust building",
      "Clear communication"
    ],
    "category": "resources",
    "iconName": "Activity"
  },
  "security-protocols": {
    "title": "Security Protocols",
    "description": "Built-in security mechanisms to protect data and ensure safe monitoring.",
    "features": [
      "HTTPS encryption",
      "Security header scanning",
      "API key protection",
      "Authentication systems"
    ],
    "howItWorks": "The platform scans and enforces security practices to ensure safe operation.",
    "benefits": [
      "Data protection",
      "Improved system security",
      "Compliance readiness"
    ],
    "category": "resources",
    "iconName": "Shield"
  },
  "about-sentinel-iq": {
    "title": "About Sentinel IQ",
    "description": "An AI-powered observability platform combining monitoring, security, and blockchain-based integrity verification.",
    "features": [
      "AI diagnostics engine",
      "Real-time monitoring",
      "Blockchain audit logs",
      "Cloud integrations"
    ],
    "howItWorks": "Sentinel IQ integrates multiple technologies to provide a unified observability platform.",
    "benefits": [
      "Complete system visibility",
      "Advanced analytics",
      "Secure and reliable monitoring"
    ],
    "category": "company",
    "iconName": "Info"
  },
  "enterprise-sla": {
    "title": "Enterprise SLA",
    "description": "Service-level commitments covering uptime, performance, and support.",
    "features": [
      "Uptime guarantees",
      "Performance benchmarks",
      "Priority support",
      "Service commitments"
    ],
    "howItWorks": "Defines expectations and guarantees for enterprise users.",
    "benefits": [
      "Reliability assurance",
      "Clear expectations",
      "Enterprise trust"
    ],
    "category": "company",
    "iconName": "Award"
  },
  "contact-operations": {
    "title": "Contact Operations",
    "description": "Get in touch with our support team for technical assistance and queries.",
    "features": [
      "Email support",
      "Issue tracking",
      "Technical assistance",
      "Enterprise support"
    ],
    "howItWorks": "Users can contact support for help with issues or integrations.",
    "benefits": [
      "Quick resolution",
      "Better user experience",
      "Reliable support"
    ],
    "category": "company",
    "iconName": "Phone"
  }
};

