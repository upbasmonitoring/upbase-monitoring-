# Production Check - Integration Guide

Protect your production code by reporting failures directly to PulseWatch.

## Quick Start - Step by Step
1. **Login** to PulseWatch and navigate to the **API Keys** page.
2. **Generate** a new API Key for your external project.
3. **Copy** the implementation logic from Section 2 below into your project.
4. **Replace** `your_api_key_here` with your actual key.
5. **Trigger** an error in your project (or use our test script) to see it appear on the **Production Checks** dashboard.
6. **Click** "Analyze with Gemini" to get an AI-powered fix.

## 1. Get your API Key
Go to the **API Keys** section in PulseWatch and generate a new key.

## 2. Implement the Report Function
Add this function to your project's error handler or a dedicated monitoring utility.

```javascript
const PW_API_KEY = 'your_api_key_here';
const PW_URL = 'http://localhost:5000/api/production/report';

async function reportToPulseWatch(section, error) {
  try {
    await fetch(PW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PW_API_KEY
      },
      body: JSON.stringify({
        project: 'Your Project Name',
        section: section,
        message: error.message,
        stack: error.stack,
        details: {
          timestamp: new Date().toISOString(),
          // Add any other relevant context here
        }
      })
    });
  } catch (err) {
    console.error('Failed to report to PulseWatch:', err);
  }
}
```

## 3. Usage Example
Wrap your critical sections in try-catch blocks:

```javascript
try {
  await processPayment(orderId);
} catch (error) {
  // Report to PulseWatch
  await reportToPulseWatch('Checkout Process', error);
  
  // Handle error as usual
  throw error;
}
```

## 4. AI Troubleshooting & Security
Once an error is reported or a scan is performed, PulseWatch provides:
- **Instant Notification**: Get alerted in your configured channels.
- **AI Analysis**: PulseWatch uses Gemini-2.0-Flash to analyze the code context.
- **Root Cause Detection**: Understand why the code failed in production.
- **Smart Remediation**: Get a step-by-step fix and even a code patch.

## 5. Security Audit (New)
You can now send security findings for AI analysis. Use this to report suspected vulnerabilities, malware, or bugs in your project.

```javascript
async function reportSecurityThreat(type, message) {
  await fetch('http://localhost:5000/api/security/report', {
    method: 'POST',
    headers: { 'x-api-key': PW_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project: 'Nirman',
      type: type, // 'vulnerability', 'malware', 'virus', 'logic_bug'
      severity: 'high',
      message: message
    })
  });
}
```

## 6. AI Security Scan
PulseWatch can scan your project’s `package.json` for vulnerable dependencies using Gemini. 
Go to the **Security Dashboard** (coming soon) or use the API:
`POST /api/security/ai-scan`
