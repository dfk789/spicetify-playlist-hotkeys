# Project Status — Template

## 📋 How to Use This Document

### Task Management Guidelines
**Adding New Tasks:**
- Add new tasks to the appropriate priority section under **Active Tasks**.
- Use format: `- [ ] **Task Name**: Brief description (owner: NAME, date: YYYY-MM-DD)`
- Include sub-bullets for requirements/acceptance criteria.
- Assign realistic priority levels and owners.
- Always include a target date for accountability.

**Complex Tasks & Design Documents:**
- For multi-step or architectural work, create a design document slug:
  - File: `docs/tasks/{task-name-slug}.md`
  - Standard header:
    ```
    # Task Name — Design (Phase X)

    Owner: NAME • Status: Draft|In-Progress|Complete • Updated: YYYY-MM-DD
    ```
- Reference the slug here: `Design summary: see docs/tasks/{task-name-slug}.md`.

**Working on Tasks:**
- Mark in-progress by changing `[ ]` to `[~]` when work starts.
- Add progress notes as sub-bullets: `  - PROGRESS: brief update`.
- Update the date when making significant progress.

**Completing Tasks:**
- Mark completed with `[x]` and add completion date `(COMPLETED: YYYY-MM-DD)`.
- Move completed subsections from **Active Tasks** to **Implementation History** intact.
- Preserve notes and acceptance criteria; add a short summary of what changed.
- Reference any new files created or major code changes.

**Implementation History Structure:**
- Organize by completion date, most recent first.
- Use `#### Section Name ✅ COMPLETED (YYYY-MM-DD)` format.
- Include technical findings, file changes, and success metrics.
- Preserve the detailed task breakdowns for future reference.

**Status Updates:**
- Update the **Recently Completed** summary when moving large sections to history.
- Keep **Critical Issues** current—move resolved items to history.
- Maintain chronological accuracy; don’t back-date or alter historical entries.

---

## Current Working App Flow (Example Scaffold)
Entry Point: `ALL_CAPS_ENTRY_POINT` → handlers in `ALL_CAPS_HANDLERS_PATH`

**Stage 1: ALL_CAPS_STAGE_1_NAME**
- Files: `path/to/file1`, `path/to/file2`
- Method: `ALL_CAPS_METHOD`
- **Data Retrieved**: bullets of key fields
- Notes/Limitations: bullets

**Stage 2: ALL_CAPS_STAGE_2_NAME**
- Files: `path/to/file`
- **Data Retrieved**: bullets

**Stage 3+:** Add more stages as needed…

## Proposed Working App Flow (Optional)
Outline the target, optimized flow with stages, responsibilities, and status markers.

---

## Current Status: **ALL_CAPS_STATUS_LABEL** (YYYY-MM-DD)
Concise product-level summary (what works, what’s shipping, what’s gated).

### Recently Completed (YYYY-MM-DD)
- ✅ Item 1
- ✅ Item 2

## CRITICAL ISSUES — Immediate Priority
- **Issue**: one-line description  
  **Impact**: why it matters  
  **Root Cause**: if known  
  **Owner**: NAME • **Date**: YYYY-MM-DD  
  **Status**: TODO|INVESTIGATING|FIXED (date)

---

## Active Tasks
### PHASE 0: Foundation
- [ ] **Task**: description (owner: NAME, date: YYYY-MM-DD)
  - Acceptance: bullets

### PHASE 1: Core Features
- [ ] **Task**: description (owner: NAME, date: YYYY-MM-DD)

### PHASE 2: Enhancements
- [ ] **Task**: description (owner: NAME, date: YYYY-MM-DD)

---

## Implementation History
### Recent Completions (YYYY-MM-DD)
#### Section Name ✅ COMPLETED (YYYY-MM-DD)
- [x] **Task**: summary (COMPLETED: YYYY-MM-DD)
  - Key Findings: bullets
  - Files Changed: bullets
  - Metrics/Results: bullets

### Older Completions
- Keep prior sections in chronological order.
