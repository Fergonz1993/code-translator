# TODO_RALPH.md

## P0 — Correctness / Security / Critical Path
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

## P1 — Reliability / Observability / Performance
- [x] ATOM-011: Timeout por provider en /api/translate.
- [x] ATOM-012: Retry con backoff para errores transitorios.
- [x] ATOM-013: Mapear errores de providers a status codes estables.
- [x] ATOM-014: Loggear latencia y modelo en /api/translate.
- [x] ATOM-015: Loggear consumo y refunds de creditos con requestId.
- [x] ATOM-016: Helper de logging estructurado para rutas API.
- [x] ATOM-017: Cache LRU server-side de traducciones.
- [x] ATOM-018: Configurar busy_timeout en SQLite.
- [ ] ATOM-019: Agregar indice para credit_transactions por session_id/created_at.

## P2 — DX / Cleanup / Nice-to-have
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
