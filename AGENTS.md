# AGENTS.md (Code Translator)

This file is for agentic coding assistants working in this repo.
Goal: ship safely (no behavior regressions), with fast feedback loops.

Note: product backlog/roadmap should live in GitHub issues; this file is workflow-focused.

## Stack / Layout (quick map)
- Stack: Next.js (App Router) + React + TypeScript + Tailwind.
- Entry points:
  - UI: `app/page.tsx`, `app/layout.tsx`
  - API: `app/api/**/route.ts` (most routes set `export const runtime = "nodejs";`)
  - Edge/proxy headers: `proxy.ts` (Next canary “middleware → proxy” convention)
- Key libs:
  - Validation: `lib/schemas.ts` (Zod)
  - Errors: `lib/errors.ts` + `lib/api-errors.ts`
  - Session cookies: `lib/session.ts`
  - Origin validation: `lib/security.ts`
  - Credits ledger (SQLite): `lib/credits-store.ts` → `data/credits.sqlite`
  - Translation cache (SQLite + memory LRU): `lib/services/translation-cache.ts` → `data/cache.sqlite`

## Rules of engagement (safety)
- Use **bun** for all JS/TS tooling (no npm/yarn/pnpm).
- Do not add secrets; do not log API keys, Stripe signatures, webhook bodies, or raw user code.
- Keep changes small and PR-friendly; avoid rewrites.
- Don’t change behavior unless you:
  1) clearly state the change,
  2) add/update tests proving it,
  3) run the full validation commands.

## Commands (copy/paste)

### Install
- `bun install`

### Dev server
- `SESSION_SECRET=local-dev bun run dev`
- If you hit env validation issues: `SKIP_ENV_VALIDATION=true SESSION_SECRET=local-dev bun run dev`

### Typecheck
- `bun run typecheck`

### Lint
- `bun run lint`
- Auto-fix: `bun run lint:fix`
- Lint a single file (fast): `bunx eslint "app/page.tsx"`
- Fix a single file: `bunx eslint "app/page.tsx" --fix`

### Tests (Vitest)
- Run all tests: `bun run test`
- Watch mode: `bun run test:watch`

**Run a single test file**
- `bun run test -- "tests/errors.test.ts"`

**Run a single test by name (grep)**
- `bun run test -- -t "context length"`

**Run one test within one file**
- `bun run test -- "tests/errors.test.ts" -t "maps context"`

### Build
- `SESSION_SECRET=local-dev SKIP_ENV_VALIDATION=true bun run build`

### Production smoke test
- `SESSION_SECRET=local-dev SKIP_ENV_VALIDATION=true bun run smoke`
- Build + smoke: `SESSION_SECRET=local-dev SKIP_ENV_VALIDATION=true bun run build && SESSION_SECRET=local-dev SKIP_ENV_VALIDATION=true bun run smoke`

## Git workflow (recommended)
- Branch naming: `godmode/<topic>` (or `fix/<topic>`).
- Keep commits small and descriptive; prefer squash-merge into `main`.
- Never force-push to `main`.
- Before shipping: run typecheck → tests → lint → build+smoke.

## Env vars (common)
- `SESSION_SECRET`: required in production; set a dummy for local dev.
- `APP_URL`: required in production for checkout + origin validation.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- AI providers: `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`.

## Code style (follow existing patterns)

### Formatting
- Prefer the existing style; don’t introduce a new formatter.
- Use double quotes and semicolons (match repo).
- In longer files, use section dividers like `// ===== SECTION NAME =====`.

### Imports
- Use `@/` alias for repo-root imports (configured in `vitest.config.ts`).
- Prefer named imports.
- Use `import type { ... }` for types.
- Import order (recommended):
  1) Node built-ins (`crypto`, `path`, etc.)
  2) third-party packages
  3) `@/lib/*` and `@/app/*`
  4) relative imports
- Avoid pulling server-only code into client components/hooks (watch for `"use client"`).

### Types & naming
- Avoid `any` unless truly needed; prefer `unknown` + narrowing.
- Exported functions/types should have clear names and stable return types.
- Naming: descriptive identifiers; booleans start with `is/has/can`.

### Error handling (API routes)
- Validate inputs with Zod (`lib/schemas.ts`) and format errors via `parseRequest`.
- For `/api/translate`, enforce payload byte limits with `lib/request-body.ts`.
- Use `jsonError(...)` (`lib/api-errors.ts`) for consistent JSON error shape.
- Convert unknown provider/library errors with `toAppError(...)` (`lib/errors.ts`).
- Return stable HTTP status codes (e.g., 400/401/402/403/413/429/5xx) and a non-leaky message.

### Logging
- Prefer structured logging helpers:
  - API route logs: `lib/api-logger.ts`
  - Translate logs: `lib/translate-logger.ts`
  - Credits logs: `lib/credits-logger.ts`
- Never log:
  - API keys
  - full user code
  - Stripe session/payment_intent IDs (unless explicitly approved)
  - webhook raw payloads/signatures

### Security notes
- Origin validation protects credit-consuming endpoints: `validateOrigin(...)` (`lib/security.ts`).
- Security headers + CSP nonce are applied in `proxy.ts`.
- Translation cache intentionally stores `code` as `"[redacted]"` in SQLite.

## Testing guidelines (how we keep quality high)
- Prefer unit/route tests under `tests/*.test.ts`.
- Route tests should mock Stripe/SQLite/AI SDKs and avoid network calls.
- When fixing a bug: add a regression test first.
- Keep tests deterministic (use fake timers only when needed; restore them after).

## CI (what must be green)
- GitHub Actions runs:
  - `bun run typecheck`
  - `bun run lint`
  - `bun run test`
  - `bun run build` (+ env)
  - `bun run smoke` (+ env)
  See `.github/workflows/ci.yml`.

## Cursor / Copilot rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found in this repo.

## Optional: Codex skill resume (local dev)
- If you use the endless feature loop tooling:
  - `python3 ~/.codex/skills/endless-feature-loop/scripts/resume_loop.py --repo /Users/fernandogonzalez/Code-and-development/CODE-TRANSLATOR-LIVE --set-current`
