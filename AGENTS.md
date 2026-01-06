# AGENTS.md

Run this first in new sessions:
`python3 ~/.codex/skills/endless-feature-loop/scripts/resume_loop.py --repo /Users/fernandogonzalez/Code-and-development/CODE-TRANSLATOR-LIVE --set-current`

## RALPH_STATE (SOURCE OF TRUTH)

### North Star Goal
- Secure all credit and translation endpoints against abuse and spoofing.
- Make AI provider calls resilient (timeouts, retries, stable error mapping).
- Preserve billing/credits integrity with safe Stripe flows.
- Add observability (requestId, latency, credit events).
- Achieve a well-tested backend for schemas, sessions, credits, and translate flows.

### Current Iteration
- batch: 1
- iteration: 17
- current_atomic_feature: ATOM-019: Agregar indice para credit_transactions por session_id/created_at.

### Backlog Snapshot
P0 (must ship)
- [x] ATOM-001: Forzar runtime nodejs en rutas API con dependencias nativas.
- [x] ATOM-002: Derivar aiModelSchema desde AVAILABLE_MODELS para evitar drift.
- [x] ATOM-003: Validar request body de /api/checkout con Zod.
- [x] ATOM-004: Validar query param de /api/credits/claim con Zod.
- [x] ATOM-005: Helper de error API con requestId consistente.
- [x] ATOM-006: Agregar requestId a /api/translate en respuestas y errores.
- [x] ATOM-007: Usar APP_URL para redirects de Stripe checkout.
- [x] ATOM-008: Validar Origin/Referer allowlist en translate/checkout/claim.
- [x] ATOM-009: Rate limit por session en /api/translate.
- [x] ATOM-010: Rechazar API keys BYOK con formato sospechoso.

P1 (should ship)
- [x] ATOM-011: Timeout por provider en /api/translate.
- [x] ATOM-012: Retry con backoff para errores transitorios.
- [x] ATOM-013: Mapear errores de providers a status codes estables.
- [x] ATOM-014: Loggear latencia y modelo en /api/translate.
- [x] ATOM-015: Loggear consumo y refunds de creditos con requestId.
- [x] ATOM-016: Helper de logging estructurado para rutas API.
- [x] ATOM-017: Cache LRU server-side de traducciones.
- [x] ATOM-018: Configurar busy_timeout en SQLite.
- [ ] ATOM-019: Agregar indice para credit_transactions por session_id/created_at.

P2 (nice to have)
- [ ] ATOM-201: Tests unitarios de credits-store (grant/consume/idempotency).
- [ ] ATOM-202: Tests de session cookie signing/verificacion.
- [ ] ATOM-203: Tests de translateRequestSchema (validos/invalidos).
- [ ] ATOM-204: Tests de normalizeLineNumbers.
- [ ] ATOM-205: Tests de parseTranslationResponse.
- [ ] ATOM-206: Tests de validacion /api/checkout.
- [ ] ATOM-207: Tests de validacion /api/credits/claim.
- [ ] ATOM-208: Tests de mapping de errores en /api/translate.
- [ ] ATOM-209: Tests de rate limit en /api/translate.
- [x] ATOM-210: Fix TypeScript parse errors in tests/test-utils.ts (typecheck gate).
- [x] ATOM-211: Fix lint errors in AutosaveIndicator.tsx, CommandPalette.tsx, language-detection.ts.

### Definition of Done (DoD)
- [ ] Implemented
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Lint/typecheck/build pass
- [ ] Docs updated
- [ ] Sanity scenario written

### Completed (log)
- ATOM-001..ATOM-011 completed.
- ATOM-012 completed with retry/backoff + tests.
- ATOM-013 completed (errors mapped via toAppError + tests).
- ATOM-014 completed (structured translate logs with latency/model).
- ATOM-015 completed (credits consumption/refund logs with requestId).
- ATOM-016 completed (structured API logging helper + route logs).
- ATOM-017 completed (in-memory LRU for translation cache).
- ATOM-018 completed (SQLite busy_timeout configured).
- ATOM-210 completed (test utils moved to .tsx and fixed).
- ATOM-211 completed (lint cleanups applied).

### Failures / Learnings
- better-sqlite3 required `npm rebuild better-sqlite3` to align with Node ABI.
- Added dev dependency `@testing-library/user-event` for test utils.
- `next build` needs `SESSION_SECRET`; use `SESSION_SECRET=local-dev` for verification.
- Tests may need `npm rebuild better-sqlite3` after Node version changes.

### Blockers
- (none)

### Next Action (single line)
- Continue ATOM-019: Agregar indice para credit_transactions por session_id/created_at.
