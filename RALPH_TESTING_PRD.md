# PRD: Ralph Loop — End-to-End Testing Framework

## 1. Overview
The **Ralph Loop** (Sentinel Self-Healing Engine) is the autonomous system of PulseWatch responsible for diagnosing and remediating production outages. This document defines the testing requirements and start-to-finish workflow for all features in `selfHealingService.js`.

---

## 2. Core Features to Test

### 2.1 Recovery Rules Engine (`checkRecoveryRules`)
- **Objective**: Ensure the correct strategy is selected based on the failure type.
- **Scenarios**:
  - `process_crash` / `offline` -> `restart_process`.
  - `deployment_failure` -> `git_rollback`.
  - `uptime_fail` -> `git_rollback`.
  - `app_error` -> `ai_code_fix`.
- **Validation**: Rules engine returns the expected string for each input combination.

### 2.2 Phase 1: Local Process Restart (`restartProcess`)
- **Objective**: Verify the fastest remediation path.
- **Requirement**: Simulate `pm2 restart` or equivalent.
- **Validation**: `verifySiteUp` is called after 2 seconds; status returns `success` if site responds.

### 2.3 Phase 2: GitHub Rollback (`attemptRollback`)
- **Objective**: Revert to the last known stable commit.
- **Requirement**: 
  - Fetch last 15 commits.
  - Identification of "Stable" commit (GitHub Status = `success` OR Internal Health = `OK`).
  - Patch Git Ref to target SHA.
- **Validation**: Branch ref points to the correct previous commit after execution.

### 2.4 Phase 3: AI Code Fix (`generateAISuggestion` & `applyAICodeFix`)
- **Objective**: Generate and apply emergency patches using Gemini 2.0.
- **Requirement**:
  - `guessFilePath`: Correctly map URL/Section to file path (e.g., `/auth` -> `src/routes/auth.js`).
  - `getAIFixedCode`: Gemini receives context and returns a code block.
  - `applyAICodeFix`: Payload pushed to GitHub via `PUT /contents`.
- **Validation**: New commit contains the fix; no markdown fences in the final code.

### 2.5 Safety & Pro-Tier Constraints
- **Objective**: Prevent "Repair Loops" and accidental damage.
- **Requirements**:
  - **15-minute Guard**: Auto-rollback only if failure is within 15m of deploy.
  - **Rollback Limit**: Only 1 auto-rollback per day per monitor.
  - **Baseline Protection**: Skip if site was already down when added.
  - **Manual Override**: Verify these checks are bypassed if triggered manually.

### 2.6 Incident & Observability
- **Requirement**: Every step must log to `HealingLog` and `IncidentEvent`.
- **Validation**: Dashboard reflects "Autopilot engaged," "Rollback started," "Fix applied," etc.

---

## 3. Start-to-End Testing Workflow

### Scenario: The "Poison Commit" Flow
1. **Trigger Phase**:
   - Deploy a "Poison Commit" to a test repo (e.g., adds `throw new Error()` in `index.js`).
   - Uptime worker detects `DOWN` status.
2. **Analysis Phase**:
   - `triggerGitHubHealing` starts.
   - `checkRecoveryRules` identifies `uptime_fail` -> selects `git_rollback`.
3. **Execution Phase**:
   - `attemptRollback` scans history, finds the commit *before* the poison one.
   - Branch ref is updated.
4. **Verification Phase**:
   - `verifySiteUp` checks the URL after deployment settle time (30s).
   - `HealingLog` status changes to `healed_by_rollback`.
5. **Recovery (If Rollback Fails)**:
   - System falls through to **AI Fix**.
   - Gemini generates a PR fixing the `throw new Error()`.
   - If `Mode = Automatic`, PR is merged/pushed automatically.

---

## 4. Testing Infrastructure Requirements
- **Mocking**: Use `Sinon` to mock `axios.get` and `axios.patch` for GitHub calls.
- **Gemini Mock**: Use `GoogleGenerativeAI` mock to return fixed code strings without actual API hits during CI.
- **Database**: `test` database to verify `HealingLog` creation and `rollbackTodayCount` increments.

## 5. Success Metrics
- **Reliability**: Rules engine never selects `restart_process` for a logic bug (500 error).
- **Precision**: `guessFilePath` has 100% accuracy for the 6 defined core routes.
- **Speed**: End-to-end simulation (Detection -> Rollback) completes in <45s.
- **Safety**: 100% of "Outside window" failures are correctly skipped.
