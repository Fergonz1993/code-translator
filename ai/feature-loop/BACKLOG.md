# Feature Backlog

Goal: see GOAL.md

Legend: status in {todo|in_progress|done|blocked}

## Foundation
- F1: Forzar runtime nodejs en rutas API con dependencias nativas | status: done | deps: - | tests: bun run lint, bun run typecheck
- F2: Derivar aiModelSchema desde AVAILABLE_MODELS para evitar drift | status: done | deps: - | tests: bun run lint, bun run typecheck
- F3: Validar request body de /api/checkout con Zod | status: done | deps: F2 | tests: bun run lint, bun run typecheck
- F4: Validar query param de /api/credits/claim con Zod | status: done | deps: F2 | tests: bun run lint, bun run typecheck
- F5: Crear helper de error API con requestId consistente | status: done | deps: - | tests: bun run lint, bun run typecheck
- F6: Agregar requestId a /api/translate en respuestas y errores | status: done | deps: F5 | tests: bun run lint, bun run typecheck

## Security
- F7: Usar APP_URL para redirects de Stripe checkout | status: done | deps: F3 | tests: bun run lint, bun run typecheck
- F8: Validar Origin/Referer allowlist en translate/checkout/claim | status: done | deps: F7 | tests: bun run lint, bun run typecheck
- F9: Rate limit por session en /api/translate | status: done | deps: F1 | tests: bun run lint, bun run typecheck, bun run test
- F10: Rechazar API keys BYOK con formato sospechoso | status: done | deps: - | tests: bun run lint, bun run typecheck

## Reliability
- F11: Agregar timeout por provider en /api/translate | status: done | deps: F1 | tests: bun run lint, bun run typecheck
- F12: Retry de errores transitorios con backoff | status: in_progress | deps: F11 | tests: bun run lint, bun run typecheck, bun run test
- F13: Mapear errores de providers a status codes estables | status: todo | deps: F5 | tests: bun run lint, bun run typecheck, bun run test

## Observability
- F14: Loggear latencia y modelo en /api/translate | status: todo | deps: F6 | tests: bun run lint, bun run typecheck
- F15: Loggear consumo y refunds de creditos con requestId | status: todo | deps: F6 | tests: bun run lint, bun run typecheck
- F16: Helper de logging estructurado para rutas API | status: todo | deps: F5 | tests: bun run lint, bun run typecheck

## Performance
- F17: Cache LRU server-side de traducciones | status: todo | deps: F11 | tests: bun run lint, bun run typecheck, bun run test

## Data
- F18: Configurar busy_timeout en SQLite | status: todo | deps: F1 | tests: bun run lint, bun run typecheck
- F19: Agregar indice para credit_transactions por session_id/created_at | status: todo | deps: F18 | tests: bun run lint, bun run typecheck

## Testing
- F20: Tests unitarios de credits-store (grant/consume/idempotency) | status: todo | deps: F18 | tests: bun run test
- F21: Tests de session cookie signing/verificacion | status: todo | deps: - | tests: bun run test
- F22: Tests de translateRequestSchema (validos/invalidos) | status: todo | deps: F2 | tests: bun run test
- F23: Tests de normalizeLineNumbers | status: todo | deps: - | tests: bun run test
- F24: Tests de parseTranslationResponse | status: todo | deps: - | tests: bun run test
- F25: Tests de validacion /api/checkout | status: todo | deps: F3 | tests: bun run test
- F26: Tests de validacion /api/credits/claim | status: todo | deps: F4 | tests: bun run test
- F27: Tests de mapping de errores en /api/translate | status: todo | deps: F13 | tests: bun run test
- F28: Tests de rate limit en /api/translate | status: todo | deps: F9 | tests: bun run test
