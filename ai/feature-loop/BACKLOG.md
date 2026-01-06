# Feature Backlog

Goal: Build the most polished, performant, and secure code translation experience.

Legend: status in {todo|in_progress|done|blocked}

---

## Security (P0)
- SEC-001: Add CSP nonce for inline scripts | status: todo | deps: - | tests: manual security audit
- SEC-002: Implement SRI for CDN assets | status: todo | deps: - | tests: bun run build
- SEC-003: API request signature validation | status: todo | deps: - | tests: bun run test
- SEC-004: Session rotation after privilege changes | status: todo | deps: - | tests: bun run test
- SEC-005: Brute-force protection for API key validation | status: todo | deps: SEC-003 | tests: bun run test
- SEC-006: Code input sanitization for prompt injection | status: todo | deps: - | tests: bun run test
- SEC-007: Security headers audit | status: todo | deps: SEC-001 | tests: manual
- SEC-008: API versioning for breaking changes | status: todo | deps: - | tests: bun run test

## Performance (P0)
- PERF-001: Edge Functions for lower latency | status: todo | deps: - | tests: bun run build
- PERF-002: Redis caching layer | status: todo | deps: - | tests: bun run test
- PERF-003: Lazy load Monaco editor | status: todo | deps: - | tests: bun run build
- PERF-004: Request coalescing for duplicate calls | status: todo | deps: - | tests: bun run test
- PERF-005: WebSocket streaming translations | status: todo | deps: PERF-001 | tests: bun run test
- PERF-006: Bundle size optimization with dynamic imports | status: todo | deps: PERF-003 | tests: bun run build
- PERF-007: Translation queue for batch processing | status: todo | deps: - | tests: bun run test
- PERF-008: Database connection pooling | status: todo | deps: - | tests: bun run test
- PERF-009: Preload fonts / reduce CLS | status: todo | deps: - | tests: lighthouse
- PERF-010: Memory profiling and leak detection | status: todo | deps: - | tests: manual

## Design & UX (P1)
- DES-001: Syntax-highlighted explanations | status: todo | deps: - | tests: visual
- DES-002: Side-by-side diff view | status: todo | deps: - | tests: visual
- DES-003: Collapsible sections for long explanations | status: todo | deps: - | tests: bun run test
- DES-004: Responsive tablet layout | status: todo | deps: - | tests: visual
- DES-005: Animated loading states with progress | status: todo | deps: - | tests: visual
- DES-006: Drag-to-resize panes | status: todo | deps: - | tests: bun run test
- DES-007: Code folding sync with explanations | status: todo | deps: DES-006 | tests: bun run test
- DES-008: Custom scrollbar styles | status: todo | deps: - | tests: visual
- DES-009: High-contrast accessibility theme | status: todo | deps: - | tests: manual a11y
- DES-010: Keyboard focus indicators | status: todo | deps: - | tests: manual a11y
- DES-011: Print-friendly stylesheet | status: todo | deps: - | tests: manual
- DES-012: Onboarding video/animation | status: todo | deps: - | tests: visual

## Features (P1)
- FEAT-001: Multi-file/project translation | status: todo | deps: - | tests: bun run test
- FEAT-002: Code snippets library | status: todo | deps: - | tests: bun run test
- FEAT-003: Translation comparison (multiple models) | status: todo | deps: - | tests: bun run test
- FEAT-004: Collaborative sharing with live links | status: todo | deps: - | tests: bun run test
- FEAT-005: Export to PDF with formatting | status: todo | deps: - | tests: manual
- FEAT-006: Translation templates | status: todo | deps: - | tests: bun run test
- FEAT-007: Line-by-line highlighting sync | status: todo | deps: - | tests: visual
- FEAT-008: Translation bookmarks | status: todo | deps: - | tests: bun run test
- FEAT-009: Code complexity analysis display | status: todo | deps: - | tests: bun run test
- FEAT-010: Voice narration of explanations | status: todo | deps: - | tests: manual
- FEAT-011: Support for Go, Rust, Java | status: todo | deps: - | tests: bun run test
- FEAT-012: VS Code / JetBrains extension | status: todo | deps: - | tests: manual
- FEAT-013: Inline comments mode | status: todo | deps: - | tests: bun run test
- FEAT-014: Explanation depth levels (beginner/expert) | status: todo | deps: - | tests: bun run test
- FEAT-015: Code refactoring suggestions | status: todo | deps: - | tests: bun run test

## Quality & Reliability (P1)
- QUA-001: E2E tests with Playwright | status: todo | deps: - | tests: npx playwright test
- QUA-002: Visual regression testing | status: todo | deps: QUA-001 | tests: npx playwright test
- QUA-003: API contract testing with OpenAPI | status: todo | deps: - | tests: bun run test
- QUA-004: Load testing suite (k6/Artillery) | status: todo | deps: - | tests: k6 run
- QUA-005: Error tracking with Sentry | status: todo | deps: - | tests: manual
- QUA-006: Uptime monitoring and alerting | status: todo | deps: QUA-007 | tests: manual
- QUA-007: Health check endpoint | status: todo | deps: - | tests: bun run test
- QUA-008: Database migration system | status: todo | deps: - | tests: bun run test
- QUA-009: Graceful shutdown handling | status: todo | deps: - | tests: manual
- QUA-010: Request tracing with correlation IDs | status: todo | deps: - | tests: bun run test

## Functionality (P2)
- FUNC-001: PWA install prompt | status: todo | deps: - | tests: lighthouse
- FUNC-002: Full offline mode with sync | status: todo | deps: FUNC-001 | tests: manual
- FUNC-003: Browser extension for inline translation | status: todo | deps: - | tests: manual
- FUNC-004: Public API for programmatic access | status: todo | deps: - | tests: bun run test
- FUNC-005: SSO authentication (Google, GitHub) | status: todo | deps: - | tests: bun run test
- FUNC-006: Team/organization accounts | status: todo | deps: FUNC-005 | tests: bun run test
- FUNC-007: Usage analytics dashboard | status: todo | deps: - | tests: visual
- FUNC-008: Admin panel for credit management | status: todo | deps: - | tests: bun run test
- FUNC-009: Webhook notifications for events | status: todo | deps: - | tests: bun run test
- FUNC-010: i18n for multi-language UI | status: todo | deps: - | tests: bun run test

## Testing (P2 - Carried Over)
- ATOM-019: Add index for credit_transactions | status: todo | deps: - | tests: bun run test
- ATOM-201: Unit tests for credits-store | status: todo | deps: ATOM-019 | tests: bun run test
- ATOM-202: Tests for session cookie signing | status: todo | deps: - | tests: bun run test
- ATOM-203: Tests for translateRequestSchema | status: todo | deps: - | tests: bun run test
- ATOM-204: Tests for normalizeLineNumbers | status: todo | deps: - | tests: bun run test
- ATOM-205: Tests for parseTranslationResponse | status: todo | deps: - | tests: bun run test
- ATOM-206: Tests for /api/checkout validation | status: todo | deps: - | tests: bun run test
- ATOM-207: Tests for /api/credits/claim validation | status: todo | deps: - | tests: bun run test
- ATOM-208: Tests for error mapping | status: todo | deps: - | tests: bun run test
- ATOM-209: Tests for rate limit | status: todo | deps: - | tests: bun run test

---

## Completed (Batch 1)
- F1-F28: All foundation, security, reliability, observability, performance, data features from batch 1
