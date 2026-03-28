export const logEntries = [
  { id: 1, timestamp: "2026-03-11 14:32:05.123", type: "ERROR", endpoint: "POST /api/checkout", status: 500, message: "Payment gateway timeout after 30s" },
  { id: 2, timestamp: "2026-03-11 14:31:42.891", type: "WARN", endpoint: "POST /api/auth/login", status: 429, message: "Rate limit exceeded: 100 req/min from 192.168.1.42" },
  { id: 3, timestamp: "2026-03-11 14:31:18.456", type: "INFO", endpoint: "GET /api/health", status: 200, message: "Health check passed" },
  { id: 4, timestamp: "2026-03-11 14:30:55.234", type: "INFO", endpoint: "GET /api/products", status: 200, message: "Returned 48 products in 89ms" },
  { id: 5, timestamp: "2026-03-11 14:30:33.567", type: "ERROR", endpoint: "GET /api/payments/webhook", status: 502, message: "Bad Gateway - upstream server not responding" },
  { id: 6, timestamp: "2026-03-11 14:30:12.890", type: "INFO", endpoint: "POST /api/users", status: 201, message: "User created: user_2a8f3b" },
  { id: 7, timestamp: "2026-03-11 14:29:45.123", type: "WARN", endpoint: "GET /api/analytics", status: 408, message: "Request timeout after 15s" },
  { id: 8, timestamp: "2026-03-11 14:29:22.456", type: "INFO", endpoint: "GET /api/dashboard", status: 200, message: "Dashboard data fetched in 234ms" },
  { id: 9, timestamp: "2026-03-11 14:28:55.789", type: "ERROR", endpoint: "DELETE /api/sessions", status: 403, message: "Forbidden: insufficient permissions" },
  { id: 10, timestamp: "2026-03-11 14:28:30.012", type: "INFO", endpoint: "GET /api/notifications", status: 200, message: "12 unread notifications" },
];
