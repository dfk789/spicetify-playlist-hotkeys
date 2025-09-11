# Repository Guidelines — Template

> Fill in ALL_CAPS placeholders and remove optional bullets that don’t apply. Keep this file short; link deeper docs from `docs/`.

## Project Structure & Module Organization
- Active source: `src/` (primary application code).
- Optional packages: `packages/<name>/` (monorepo).
- Archives: `archive/` (reference-only; do not import in production).
- Data & outputs: `data/` (runtime data), `downloads/` (artifacts), `logs/` (runtime logs), build output `dist/` or `build/`.
- Docs: `docs/` (design, API, decisions). Canonical API ref: `docs/API_REF.md`.
- **Single task queue**: Maintain tasks in `STATUS.md` (see that template).

## Build, Test, and Development Commands
- Language/Runtime: **ALL_CAPS_LANGUAGE** (e.g., TypeScript / Node.js LTS).
- Build: **ALL_CAPS_BUILD_CMD** (e.g., `npm run build` → `dist/`).
- Dev (watch): **ALL_CAPS_DEV_CMD** (e.g., `npm run dev`).
- Run (CLI/app): **ALL_CAPS_RUN_CMD** (e.g., `node dist/main.js <command> [args]`).
- Test: **ALL_CAPS_TEST_CMD** (e.g., `npm test`), Coverage: **ALL_CAPS_TEST_COV_CMD**.

> Keep commands consistent with `package.json`/tooling. If not using Node, adapt the verbs (build/dev/test/run).

## Coding Style & Naming Conventions
- Language standard: **ALL_CAPS_LANG_STANDARD** (e.g., ES2022).
- Formatting: Indent **ALL_CAPS_INDENT** spaces; **ALL_CAPS_SEMICOLONS**; line length **ALL_CAPS_LINE_LEN**.
- Names: camelCase for functions/variables, PascalCase for types/classes, kebab-case for file names (adapt if your language differs).
- Imports/modules: Prefer relative within `src/`. Avoid importing from `archive/*` in production.
- Keep modules small; avoid cross-cutting abstractions until justified by usage.

## Testing Guidelines
- **Framework**: **ALL_CAPS_TEST_FRAMEWORK** (e.g., Vitest/Jest/pytest).
- **Structure**: Place tests under `tests/` (e.g., `*.spec.ts` or `*.test.ts`).
- **Types**: Unit tests for functions, integration tests for I/O and DB, E2E/CLI tests for commands.
- **Data**: Use separate test databases or fixtures (e.g., `test-data/`) to avoid contaminating production data.
- **Commands**: `ALL_CAPS_TEST_CMD`, `ALL_CAPS_TEST_WATCH_CMD`, `ALL_CAPS_TEST_COV_CMD`.
- **Example**:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { example } from '../src/example';
  describe('example', () => {
    it('works', () => {
      expect(example()).toBe(true);
    });
  });
  ```

## Commit & Pull Request Guidelines
- Commits: short, imperative subject (≤72 chars), focused scope (e.g., `api: fix session header merge`).
- PRs: include purpose, approach, before/after notes, and any config/command changes. Link issues. Provide minimal repro (e.g., a sample command).
- Avoid mixing cleanup with behavioral changes. Keep diffs reviewable.

## Security & Configuration
- Use `.env` for secrets and environment-specific settings. Treat cookies/tokens as secrets.
- Never commit secrets (`.env`, `data/*.json`, private keys). Provide `.env.example`.
- Optional network controls: `PROXY_URL`, feature flags like `TOR_ENABLED` (adapt to your stack).
- Document primary session/config files in README (e.g., `data/session.json`).

## Documentation Discipline
- Keep `README.md` current (features, quick start, commands). Update on every user-facing change.
- Keep `docs/API_REF.md` current (public functions/types and examples). Update alongside code.
- Single sources of truth: don’t duplicate—link out to design docs or archives when needed.

## Task Delegation & Scope Control
- Use `STATUS.md` as the single task queue with one‑line bullets; cap list length reasonably.
- If details are needed, create `docs/tasks/<slug>.md` (max ~300 words) and link from `STATUS.md`.
- PR checklist should include: README/API_REF updated? Breaking changes? Sample command?

## Runtime/Session Specifics (Optional)
- Identify your session/config single source of truth (e.g., `data/session-cookies.json`).
- Document any `.env` overrides that your app supports and how they’re logged/warned.
- Specify interactive vs non-interactive expectations (e.g., headful vs headless login).
