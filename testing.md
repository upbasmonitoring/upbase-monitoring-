# 🛡️ Upbase Real-World Testing Protocol (UAT)

This document outlines the step-by-step manual testing plan to verify every feature of the **Upbase Monitoring System** using real integrations (GitHub, Discord, WhatsApp, Email).

---

## 🧪 Phase 1: Real-Time Node Connectivity
**Objective**: Verify that the monitoring engine correctly identifies "UP" and "DOWN" states.

- [ ] **Test 1.1: Standard UP State**
    - **Action**: Add a new monitor for a real website (e.g., `https://google.com`).
    - **Expected**: Monitor should show "Optimal" (Green) within 30 seconds. Response time should be logged.
- [ ] **Test 1.2: Real DOWN State**
    - **Action**: Add a monitor for a non-existent URL (e.g., `http://invalid-xyz-123.com`) or a local server that is currently off.
    - **Expected**: Status should switch to "Offline" (Red) after the failure threshold.
- [ ] **Test 1.3: Keyword Search**
    - **Action**: Add a monitor with a specific "Success Keyword" found on the page (e.g., "Search" on Google).
    - **Expected**: Monitor stays UP if word is found, goes DOWN if word is missing.

---

## 📡 Phase 2: Alerting & Communication (Real Integrations)
**Objective**: Ensure you receive real notifications in under 60 seconds.

- [ ] **Test 2.1: Discord Webhook**
    - **Action**: Input your real Discord Webhook URL. Trigger a site failure.
    - **Expected**: A rich embed alert message appears in your Discord channel.
- [ ] **Test 2.2: Email Alerts**
    - **Action**: Trigger a failure for a monitor with Email alerts enabled.
    - **Expected**: A professional HTML email arrives in your inbox.
- [ ] **Test 2.3: WhatsApp Uplink**
    - **Action**: Ensure the WhatsApp service is authenticated. Trigger a "CRITICAL" failure.
    - **Expected**: Ralph sends a message to your registered phone number.

---

## 🧠 Phase 3: Ralph Intelligence (Gemini AI)
**Objective**: Verify the "Brain" of the system.

- [ ] **Test 3.1: Deep RCA (Root Cause Analysis)**
    - **Action**: Go to the **Ralph Intelligence** page. Look at a recent failure.
    - **Expected**: Gemini AI should provide a "Deep Analysis" explaining why the 504/404 occurred in technical detail.
- [ ] **Test 3.2: Manual Trigger**
    - **Action**: Click the **"Manual Recovery" (Power Button)** on a monitor.
    - **Expected**: Ralph should immediately begin a "Signal Scan" and provide a fresh thought stream.

---

## 🛠️ Phase 4: Self-Healing & GitHub Rollback
**Objective**: Test the most complex part of the system—the automated rollback.

- [ ] **Test 4.1: Manual Rollback**
    - **Action**: Go to the **Self-Healing** page of a monitor linked to a real GitHub repo. Click **"Execute Rollback"**.
    - **Expected**: A new deployment/revert should be visible in your GitHub Actions/Commits.
- [ ] **Worst Case: Invalid Token**
    - **Action**: Remove the GitHub token or use an invalid one in Settings. Try to trigger a rollback.
    - **Expected**: Ralph should log `HEALING_FAILED` and notify you that manual intervention is required.

---

## 📉 Phase 5: Dashboard & Global Feed
**Objective**: Performance and visual integrity.

- [ ] **Test 5.1: Real-time Feed Synchronization**
    - **Action**: Keep the Dashboard open while turning your local test server ON and OFF.
    - **Expected**: The **Global Signal Feed** should update in real-time WITHOUT a page refresh.
- [ ] **Test 5.2: Security Shield Verification**
    - **Action**: Quickly refresh the page 20 times (Simulated Rate Limit).
    - **Expected**: The system should trigger a rate limit warning or temporary block as per `securityShield` middleware.

---

## 🚨 Final Test Case: The "Total Outage" (Worst Case)
1. **Action**: Shut down multiple servers at once.
2. **Analysis**:
    - Does the **Fleet Health Score** drop accurately?
    - Does Ralph prioritize the most critical node?
    - Are multiple alerts sent without a "Circular Retry" bug?

---
**Status**: 🛠️ READY FOR TESTING
**Version**: 2.4.1 (Proteus)
