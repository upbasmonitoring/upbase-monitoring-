# Sentinel Node.js SDK

Automated error tracking, performance monitoring, and self-healing integration for Node.js / Express applications.

## 🚀 Quick Setup

### 1. Installation
In your application root:
```bash
npm install axios
```
Then, copy the `sdk` folder to your project or use a local import.

### 2. Initialization
In your `index.js` (as early as possible):
```javascript
import Sentinel from './sdk/index.js';

const sentinel = new Sentinel('YOUR_PROJECT_API_KEY', {
  projectName: 'My Application',
  appVersion: '1.2.3',
  apiUrl: 'http://localhost:5000/api' // Points to your Sentinel backend
});

sentinel.init();
```

### 3. Express Support
Add the middleware to automatically report route errors:
```javascript
import express from 'express';

const app = express();
app.use(sentinel.requestHandler());

// ... your routes ...

// The error handler must be last
app.use(sentinel.errorHandler());
```

### 4. Manual Error Reporting
You can manually capture exceptions anytime:
```javascript
try {
  // Logic
} catch (error) {
  sentinel.captureException(error, { level: 'warning', section: 'Data Sync' });
}
```

## 🛡️ Self-Healing Integration
When an error is reported via the SDK, Sentinel's backend automatically:
1. Analyzes the stack trace and context.
2. Cross-references it with your linked GitHub repository.
3. Decides if a **PM2 restart**, **Git Rollback**, or **AI Autocorrection** is needed.
4. Triggers the healing flow according to your project's `healingSettings`.

---
© 2026 Sentinel Monitoring. All rights reserved.
