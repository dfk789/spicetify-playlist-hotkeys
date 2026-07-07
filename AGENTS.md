# Agents Guide — Spicetify Playlist Hotkeys

> High-level operating instructions for coding agents working in this repository.
> Keep this file concise and evergreen; move task-specific plans into dedicated documents.

---

## Orientation

- Confirm the working branch with `git branch --show-current`; create feature branches from `main` using `feat/<slug>`, `fix/<slug>`, or `docs/<slug>`.
- Run `git status -sb` before and after changes. If unrelated modifications exist, pause and clarify with the user.
- Skim `README.md` to recall user-facing behavior, build steps, and helper usage.
- Review the active GitHub Issue for current task scope. Local docs may provide durable behavior or history, but retired phase/implementation plans are not the task queue.

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
3. Read the issue body as the active task definition. Read linked canonical docs only when the issue names them as required contracts or current behavior references; retired phase/implementation plans are historical provenance unless the issue explicitly says otherwise.
4. Work on a branch named for the issue and task, such as `docs/2-readme-refresh` or `feat/4-context-menu-spike`.
5. Keep code, tests, docs, and verification evidence together.
6. Close the issue only through a merged PR or an explicit evidence-backed maintainer close.

If issue text conflicts with this file, this file wins unless the issue explicitly updates this file in the same PR.

---

## Build & Tooling Notes

- Install dependencies with `npm install`.
- Build the extension via `npm run build` (tsup bundles source to `dist/playlist-hotkeys.js` and performs type checking).
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
- Additional reference files: `react_components.html`, `playlistmenu_section.txt` (offline documentation, may exist on feature branches).

Active development work lives in GitHub Issues, not in local docs. Durable design/research docs may live in `docs/` on feature branches but must not be treated as task trackers. When a feature branch is merged, its durable docs become reference material; its tracker docs (phase plans, improvement plans, session notes, checklists) must be deleted before or during merge.
