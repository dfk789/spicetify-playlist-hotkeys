# GitHub Tracking Migration Inventory

Created: 2026-07-03
Status: Pilot inventory
Scope: `dfk789/spicetify-playlist-hotkeys`

## Purpose

This document records how the repo moved from markdown-based planning notes to GitHub Issues. It is intentionally historical after the pilot: active task scope should live in GitHub Issues, while local docs remain for durable contracts, user-facing behavior, architecture notes, evidence, and provenance.

## Repository state at inventory time

- Local path: `/home/danny/projects/spicetify-playlist-hotkeys`
- GitHub repo: `dfk789/spicetify-playlist-hotkeys`
- Current branch observed during source audit: `feature/react-migration`
- Clean PR base for the pilot workflow files: `main`
- Existing GitHub issues observed before migration: none
- Existing labels observed before migration: GitHub defaults only
- Local `feature/react-migration` worktree was dirty before this migration slice. The migration must not reset, overwrite, or stage unrelated user/agent work.

Important: several planning sources referenced below exist on `feature/react-migration` and were not present on `main` at the time this clean pilot branch was prepared. This inventory is still useful as the task-tracking map for the active React migration branch, but agents working from `main` must verify which docs exist on their current branch before relying on a path.

## Source-of-truth split

### Stays canonical in repo docs

- `AGENTS.md` — repo engineering contract and agent workflow rules.
- `README.md` — user-facing install, usage, helper, and build guidance.
- Current runbooks, API references, and evidence records when they describe durable behavior rather than future tasks.

### Active work now lives in GitHub Issues

- GitHub Issues are the active task queue for implementation, documentation, research, and verification work.
- A migrated issue should be self-contained: objective, task context, scope, acceptance criteria, risk constraints, verification, and completion evidence should be in the issue body.
- Local phase/implementation files may be mentioned as historical provenance, but should not be required reading for task scope unless the issue explicitly identifies a canonical current doc.

### Historical or superseded planning

- `docs/CHANGELOG.md`, `docs/SESSION_NOTES.md`, `docs/PHASE_*_SUMMARY.md`, `docs/PHASE_3_PLAN.md`, and `docs/improvement-plan.md` are retained as history/rationale where present on a branch.
- Older unchecked roadmap boxes must be reconciled into GitHub Issues before agents treat them as active work.
- Do not create new work by editing retired phase-plan checklists; create or update GitHub Issues instead.

## Candidate milestones

Use milestones only if helpful; do not over-model the pilot.

- `Phase 6: Optional Features`
- `Documentation & Testing`
- `Marketplace Prep`

## Initial issue candidates

Create only a small batch first, then review the workflow before migrating everything.

| Candidate | Source | Suggested labels | Notes |
|---|---|---|---|
| Run focused/global hotkey manual verification and capture OS results | `docs/improvement-plan.md` Manual Verification Suite; `docs/PHASE_0_SUMMARY.md` remaining manual tests | `type:research`, `status:needs-evidence`, `agent:needs-human` | Manual testing likely requires Spotify/Spicetify environment. Keep evidence in issue comments/docs. |
| Update README and demo assets after React/settings refactor | `docs/CHANGELOG.md` Documentation & Testing; `docs/improvement-plan.md` section 7 | `type:docs`, `priority:next`, `agent:ready` | Should read latest code and current README before editing. |
| Draft Spicetify Marketplace manifest and submission checklist | `docs/CHANGELOG.md` Marketplace Preparation; `docs/improvement-plan.md` section 7 | `type:docs`, `type:research`, `priority:later`, `agent:ready` | Research required; no submission until badman approves. |
| Evaluate Phase 6 context menu feature | `docs/improvement-plan.md` optional enhancements; `docs/CHANGELOG.md` Phase 6 | `type:feature`, `type:research`, `priority:later`, `agent:ready` | Start as spike/design, not implementation. |
| Evaluate Phase 6 playback control hotkeys | `docs/improvement-plan.md` optional enhancements; `docs/CHANGELOG.md` Phase 6 | `type:feature`, `type:research`, `priority:later`, `agent:ready` | Needs conflict/risk analysis before implementation. |

## GitHub label requirements for pilot

Apply the global labels from the cross-project migration plan, at least:

- `priority:now`, `priority:next`, `priority:later`
- `status:blocked`, `status:needs-review`, `status:needs-evidence`, `status:partial`
- `type:bug`, `type:feature`, `type:docs`, `type:chore`, `type:spike`, `type:research`, `type:safety`
- `agent:ready`, `agent:blocked`, `agent:needs-human`
- `risk:dangerous`, `risk:secret-sensitive`, `risk:external-side-effect`

For this repo, add these repo-specific labels if/when they become useful:

- `spicetify`
- `hotkeys`
- `helper`
- `settings-ui`
- `playlist-api`
- `marketplace`
- `manual-verification`

## Required issue body conventions

Each migrated issue should be self-contained and include:

- Objective
- Task context summarizing the current facts and decisions needed to work
- Scope and out-of-scope notes
- Acceptance criteria
- Safety/risk constraints
- Canonical docs to obey, if any; do not list retired phase plans as the task definition
- Verification required
- Completion evidence required
- Optional historical provenance noting where the task came from

For manual verification tasks, evidence should include OS, Spotify/Spicetify version where available, commands/scripts used, observed behavior, and whether any docs were updated.

## Required AGENTS.md update

Add a concise GitHub Issue Tracking section while preserving existing repo rules. The section should say:

- GitHub Issues are the active task queue after migration.
- `AGENTS.md` remains the engineering contract.
- Issue bodies are the active task definitions.
- Linked local docs should be read only when they are current canonical contracts/references; retired phase or implementation plans are historical provenance unless explicitly marked otherwise.
- One issue should map to one branch/PR where practical.
- Issues close only via merged PR or explicit evidence-backed close.

## Migration progress

- [x] Inventory created.
- [x] Templates added under `.github/`.
- [x] Labels applied to GitHub.
- [x] Initial issue batch created.
- [x] `AGENTS.md` patched with GitHub tracking clause.
- [x] Pilot slice committed.
- [ ] Cross-project migration control document updated.

## Initial issue batch

- #1 — Run manual hotkey verification across focused and helper-backed modes
- #2 — Update README and demo assets after React/settings refactor
- #3 — Draft Spicetify Marketplace manifest and submission checklist
- #4 — Evaluate Phase 6 context menu feature as a spike
- #5 — Evaluate Phase 6 playback control hotkeys as a spike

## Lessons from pilot

- The repo had substantial unrelated dirty work before migration. The pilot must stage only migration files and must not reset or overwrite existing changes.
- `docs/CHANGELOG.md` was more up to date than `docs/improvement-plan.md`; future migrations should cross-check phase summaries and changelog before creating issues from older unchecked roadmap items.
