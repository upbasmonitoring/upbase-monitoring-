# Plan: Add Vibe Figma Agent

## 1. Overview & Strategy
- **Objective**: Integrate a specialized `vibe-figma-agent` to bridge the gap between Figma designs and production-ready code using `vibefigma` CLI.
- **Architectural Bet**: By using a dedicated agent for Figma integration, we ensure UI/UX consistency and leverage specialized tools (`npx vibefigma`) without bloating the `frontend-specialist`.
- **Risk Mitigation**: Environment variables (Figma PAT) will be handled via `.env` to avoid secret leakage.

## 2. Tech Stack (2026 Standards)
- **Tooling**: `vibefigma` CLI (`npx vibefigma --interactive`).
- **Output**: Next.js (App Router), Tailwind CSS v4, React 19.
- **Environment**: Figma Personal Access Token (PAT) required.

## 3. Task Breakdown (Production-First)

### T1: Foundation - Agent Creation
- **Task**: Create `.agent/agents/vibe-figma-agent.md`.
- **Details**: Define the agent persona, tools, and production-ready rules.
- **Agent**: `project-planner`
- **Skill**: `clean-code`
- **Verify**: File exists and follows the standardized "Perfect Agent" format.

### T2: Architecture Update
- **Task**: Update `.agent/ARCHITECTURE.md` to include the new agent.
- **Details**: Add `vibe-figma-agent` to the Agents table and Quick Reference section.
- **Agent**: `project-planner`
- **Skill**: `clean-code`
- **Verify**: `ARCHITECTURE.md` correctly reflects the 21-agent count and role.

### T3: Secret Setup (Guidance)
- **Task**: Document how the user should set up the Figma PAT.
- **Details**: Add a note to the new agent file or a separate `.env.example` update.
- **Agent**: `security-auditor`
- **Skill**: `vulnerability-scanner`
- **Verify**: Ensure no secrets are hardcoded.

## 4. Phase X: Verification Matrix
- [ ] **Agent Format**: Follows the new "Perfect" structure (Critical Rules, Stack, Loop).
- [ ] **CLI Access**: Agent knows how to use `npx vibefigma`.
- [ ] **Architecture Sync**: `ARCHITECTURE.md` updated.
- [ ] **Security**: No secrets hardcoded.

---
## ✅ PHASE X COMPLETE
- Date: 2026-03-02
