# 📄 UPBASE MONITORING: FULL PROJECT DOCUMENTATION

### 1. PROJECT OVERVIEW
*   **Project Name**: Upbase Monitoring (Guardian of the Fleet)
*   **Problem it Solves**: Eliminates the delay between a website breaking and a developer fixing it. It automates the "Oh No!" moment.
*   **One-line Description**: An AI-powered site monitor that fixes code errors automatically via Git rollbacks and alerts you through a human-like WhatsApp bot.

### ⚙️ 2. CORE FEATURES (WHAT YOU BUILT)
*   **Global Monitoring**: 24/7 pings for Uptime, Response Time, and SSL health.
*   **Tiered Alert System**: Automatic escalation from WhatsApp → Discord → Email based on downtime duration (1-15 mins).
*   **Ralph Intelligence Engine**: Logic-based analysis that finds the "Why, What, and How" of every failure.
*   **Ralph AI Loop**: Autonomous root cause analysis (RCA) and remediation.
*   **VCS Integration**: Secure linking to GitHub for automated versions management.
*   **WhatsApp Hub**: Interactive command center (`STATUS`, `ROLLBACK`) with persistent QR login.
*   **API Key Controller**: Secure management for external developer access.

### 🧠 3. UNIQUE FEATURES (VERY IMPORTANT)
*   **Ralph Intelligence**: Not just logs—it determines the cause (e.g., "Bad Deploy") and suggests the "How-to-Fix" (e.g., "Rollback").
*   **Self-Healing Rollback**: Ralph doesn't just alert; it hits the GitHub API to roll back your code to the last working version instantly.
*   **WhatsApp Anti-Ban Engine**: Simulates "Human Thinking" and "Typing..." states to protect your number from being banned by Meta.
*   **Deployment Impact Insight**: Tracks how your code changes affect your site's speed and reliability over time.

### 🏗️ 4. ARCHITECTURE
**Simple Flow**:
Frontend (React/Vite) → REST API (Backend Node.js) → Database (MongoDB) → Monitoring Engine → Multi-Channel Alert Workers.

### 🛠️ 5. TECH STACK
*   **Frontend**: React.js, Tailwind CSS, Lucide Icons, Shadcn UI.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose), Redis (Mocked/In-Memory).
*   **APIs Used**: GitHub REST API, WhatsApp-web.js (Puppeteer), Nodemailer (SMTP).

### 🔐 6. SECURITY FEATURES
*   **JWT (JSON Web Tokens)**: Secure user session management.
*   **GitHub Token Encryption**: All Personal Access Tokens are encrypted before being stored in the database.
*   **API Key System**: Shielded headers for monitoring data access.
*   **Secure Headers**: Implemented Helmet and Express-Security shields.

### 🔄 7. WORKFLOW (END-TO-END)
1.  **User adds site**: Enters URL and links GitHub Repo.
2.  **Monitoring starts**: Backend pings URL every 60 seconds.
3.  **Failure Detected**: Site is down for 3 minutes (3 failures).
4.  **Alert dispatched**: WhatsApp and Discord pings the developer immediately.
5.  **Ralph Intervenes**: AI analyzes the 500 error code and identifies the "Bad Commit."
6.  **Rollback**: System triggers GitHub API to restore the last stable code.
7.  **Recovery**: Site is UP; Recovery alert is sent to WhatsApp.

### 🧪 8. TESTING
*   **Manual Failure Testing**: Simulated downtime using `localhost:3000` to trigger the 3-failure gate.
*   **RCA Validation**: Tested Ralph's ability to distinguish between "Network Jitter" and a "Hard Server Error."
*   **Rollback Scenarios**: Verified that rollbacks only trigger when GitHub credentials are valid.

### 📊 9. DASHBOARD FEATURES
*   **Real-time Graphs**: Visualizes response time spikes.
*   **Live Incident Logs**: Searchable history of every downtime event.
*   **Integration Portal**: QR Code scanner for WhatsApp and Webhook setup for Discord.

### 🚀 10. FUTURE IMPROVEMENTS
*   **AI Predictive Insights**: Predict downtime BEFORE it happens by analyzing slow-downs.
*   **Edge Monitoring**: Ping your site from New York, London, and Tokyo simultaneously.
*   **WhatsApp Action Buttons**: Tap "Fix Now" directly in your WhatsApp message.

---
_Upbase Monitoring v1.0.0 Alpha - Architectural Master Documentation_
