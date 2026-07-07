# Agents Guide — Spicetify Playlist Hotkeys

> High-level operating instructions for coding agents working in this repository.
> Keep this file concise and evergreen; move task-specific plans into dedicated documents.

---

## Orientation

- Confirm the working branch with `git branch --show-current`; create feature branches from `main` using `feat/<slug>`, `fix/<slug>`, or `docs/<slug>`.
- Run `git status -sb` before and after changes. If unrelated modifications exist, pause and clarify with the user.
- Skim `README.md` to recall user-facing behavior, build steps, and helper usage.
- Review the active GitHub Issue for current task scope. Durable design/research docs may live in `docs/`, but retired phase/implementation plans are not the task queue.

---

## Workflow Expectations

- Use the planning tool for multi-step work (two or more actions). Keep the plan updated as you progress.
- Prefer `apply_patch` for text edits in tracked files. Avoid editing generated artifacts under `dist/`.
- Maintain TypeScript strictness: avoid `any`, add types when the compiler cannot infer them, and document temporary workarounds.
- Keep changes scoped and incremental. Update documentation and assets relevant to your edits.
- Never remove or reset user changes. Avoid destructive git commands (`reset --hard`, `checkout --`) unless explicitly instructed.

---

## GitHub Issue Tracking

Active implementation, documentation, research, and verification tasks are tracked in GitHub Issues for this repository.
Before starting work:

1. Read this `AGENTS.md` first. It remains the engineering contract.
2. Select or create one GitHub Issue for the atomic task.
3. Read the issue body as the active task definition. Read linked canonical docs only when the issue names them as required contracts or current behavior references.
4. Work on a branch named for the issue and task, such as `docs/2-readme-refresh` or `feat/4-context-menu-spike`.
5. Keep code, tests, docs, and verification evidence together.
6. Close the issue only through a merged PR or an explicit evidence-backed maintainer close.

If issue text conflicts with this file, this file wins unless the issue explicitly updates this file in the same PR.

---

## Build & Tooling Notes

- Install dependencies with `npm install`.
- Build the extension via `npm run build` (Spicetify Creator builds `src/app.tsx` to `dist/playlist-hotkeys.js`; the `spicetify` CLI must be installed and on `PATH`).
- The tsup configs are still used for test/benchmark helper extensions, not the primary production build.
- Debug logging can be toggled inside Spotify’s console with:
  - `PlaylistHotkeysDebug(true | false)`
  - `PlaylistHotkeysDebugState()`

Add new scripts or tools only when necessary and document them in the appropriate plan or README section.

---

## Communication & Approvals

- The environment may restrict filesystem or network access. Attempt sandbox-friendly commands first; if escalation is required, use the approval workflow with a clear justification.
- Surface blockers promptly. If repository state looks inconsistent (unexpected files, failing builds unrelated to your work), stop and ask the user how to proceed.
- When summarizing work, highlight what changed, why it was changed, and any follow-up actions the user may want to take (tests, builds, etc.).

---

## Reference Documents

- `README.md` — installation, usage, helper instructions, demo.
- `docs/CHANGELOG.md` — release history (not an active task tracker).
- `docs/COSMOS_SUB_RESEARCH.md` — CosmosAsync subscription API research findings.
- `docs/experiments/` — durable research procedures, test guides, and architecture notes:
  - `BENCHMARK_GUIDE.md` — playlist API performance benchmarking guide.
  - `EXTENSION_PATTERNS.md` — reference extension pattern analysis.
  - `QUICK_TEST_GUIDE.md` — quick keyboard test guide.
  - `TEST_INSTRUCTIONS.md` — full keyboard focus test instructions.
  - `focus-shortcut-test.md` — focus-mode shortcut prototype plan.
  - `helper-ux-outline.md` — helper UX improvement strategy.
  - `settings-ui-plan.md` — React settings UI architecture (completed).
- Additional reference files: `react_components.html`, `playlistmenu_section.txt` (offline documentation).

Active development work lives in GitHub Issues, not in local docs. Durable design/research docs may live in `docs/` but must not be treated as task trackers.
