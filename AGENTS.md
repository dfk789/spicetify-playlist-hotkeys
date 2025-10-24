# Agents Guide — Spicetify Playlist Hotkeys

> High-level operating instructions for coding agents working in this repository.  
> Keep this file concise and evergreen; move task-specific plans into dedicated documents.

---

## Orientation

- Confirm the working branch with `git branch --show-current`; create feature branches from `main` using `feat/<slug>`, `fix/<slug>`, or `docs/<slug>`.
- Run `git status -sb` before and after changes. If unrelated modifications exist, pause and clarify with the user.
- Skim `README.md` to recall user-facing behavior, build steps, and helper usage.
- Review recent commits or discussion to understand current focus. Detailed plans live in `docs/`.

---

## Workflow Expectations

- Use the planning tool for multi-step work (two or more actions). Keep the plan updated as you progress.
- Prefer `apply_patch` for text edits in tracked files. Avoid editing generated artifacts under `dist/`.
- Maintain TypeScript strictness: avoid `any`, add types when the compiler cannot infer them, and document temporary workarounds.
- Keep changes scoped and incremental. Update documentation and assets relevant to your edits.
- Never remove or reset user changes. Avoid destructive git commands (`reset --hard`, `checkout --`) unless explicitly instructed.

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
- `docs/improvement-plan.md` — active missions, research tasks, and detailed design goals.
- Additional reference files: `react_components.html`, `playlistmenu_section.txt` (offline documentation).

Keep AGENTS.md focused on these global instructions. Update `docs/improvement-plan.md` (or other docs under `docs/`) with project-specific strategies, to-do lists, or research findings.
