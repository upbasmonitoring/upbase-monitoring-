# PRD: Ralph Loop — Autonomous AI Self-Healing Integration

## 1. Objective
Implement an autonomous "Ralph Loop" within PulseWatch that automatically diagnoses and remediates production outages. This integration will leverage the Ralph Loop methodology to bridge the gap between "Alerting" and "Resolution."

## 2. Context
We have "Intelligent Alerting" which identifies *when* things go wrong. Now we need "Ralph" to determine *why* and *how to fix it* without human intervention.

## 3. High-Level Requirements
- **Trigger**: Critical alerts (DOWN status) initiate the Ralph Loop.
- **Diagnostics**: AI must ingest the last 50 lines of logs and the failing HTTP status/body.
- **Root Cause Analysis (RCA)**: AI identifies the specific file/function causing the failure.
- **Remediation**: 
    - Tier 1: Automated Rollback (if GitHub is connected).
    - Tier 2: AI-Generated Hotfix PR (Draft).
- **Communication**: Post the diagnostic results to Discord/Slack.

---

## 4. Technical Tasks

### 4.1 Backend: Ralph Trigger Service
- [ ] Create `backend/services/ralphService.js` to manage the autonomous loop state.
- [ ] Implement `triggerRalphLoop(monitorId)` hook in `alertService.js`.
- [ ] Add `ralphStatus` field to `Monitor` model (IDLE, ANALYZING, REMEDIATING, STABILIZING).

### 4.2 Diagnostic Ingestion
- [ ] Update `uptimeWorker.js` to store the last failed response body in a cache/temp-log.
- [ ] Implement a log collector that pulls recent entries from `MonitorLog` for the specific monitor.

### 4.3 AI RCA & Localizer
- [ ] Extend `incidentService.js` to call Gemini with a "Diagnostic Bundle" (Logs + Response + Deployment History).
- [ ] Create a "Code Localizer" that uses the Git history to find the most likely "Poison" lines.

### 4.4 Autonomic Action Center
- [ ] Implement `executeRemediation(type)` which can trigger a GitHub rollback via Octokit.
- [ ] Add a "Safe Mode" flag (default: true) to ensure actions only happen with approval in production.

### 4.5 UI: Ralph Integration View
- [ ] Build `RalphRadar.tsx` component for the Dashboard.
- [ ] Display real-time "Thought Stream" of the AI as it debugs.

---

## 5. Success Criteria
- [ ] The system accurately identifies the "Poison" commit in 90% of test cases.
- [ ] MTTR (Mean Time To Resolution) drops from minutes to under 60 seconds for automated rollbacks.
- [ ] Zero "flapping" incidents (where a fix causes a secondary failure).
