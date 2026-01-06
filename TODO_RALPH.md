# TODO_RALPH.md

## 🔒 P0 — Security
- [ ] SEC-001: Add CSP nonce for inline scripts
- [ ] SEC-002: Implement SRI for CDN assets
- [ ] SEC-003: Add API request signature validation
- [ ] SEC-004: Implement session rotation
- [ ] SEC-005: Add brute-force protection for API key validation
- [ ] SEC-006: Sanitize code input for prompt injection
- [ ] SEC-007: Security headers audit
- [ ] SEC-008: API versioning

## ⚡ P0 — Performance
- [ ] PERF-001: Edge Functions for lower latency
- [ ] PERF-002: Redis caching layer
- [ ] PERF-003: Lazy load Monaco editor
- [ ] PERF-004: Request coalescing
- [ ] PERF-005: WebSocket streaming translations
- [ ] PERF-006: Dynamic imports for bundle size
- [ ] PERF-007: Translation queue for batch processing
- [ ] PERF-008: Database connection pooling
- [ ] PERF-009: Preload fonts / reduce CLS
- [ ] PERF-010: Memory profiling

## 🎨 P1 — Design & UX
- [ ] DES-001: Syntax-highlighted explanations
- [ ] DES-002: Side-by-side diff view
- [ ] DES-003: Collapsible sections
- [ ] DES-004: Tablet layout
- [ ] DES-005: Animated loading progress
- [ ] DES-006: Drag-to-resize panes
- [ ] DES-007: Code folding sync
- [ ] DES-008: Custom scrollbar styles
- [ ] DES-009: High-contrast theme
- [ ] DES-010: Keyboard focus indicators
- [ ] DES-011: Print-friendly stylesheet
- [ ] DES-012: Onboarding video/animation

## ✨ P1 — Features
- [ ] FEAT-001: Multi-file/project translation
- [ ] FEAT-002: Code snippets library
- [ ] FEAT-003: Translation comparison (multiple models)
- [ ] FEAT-004: Collaborative sharing with live links
- [ ] FEAT-005: Export to PDF
- [ ] FEAT-006: Translation templates
- [ ] FEAT-007: Line-by-line highlighting sync
- [ ] FEAT-008: Translation bookmarks
- [ ] FEAT-009: Code complexity analysis
- [ ] FEAT-010: Voice narration
- [ ] FEAT-011: Support for Go, Rust, Java
- [ ] FEAT-012: VS Code / JetBrains extension
- [ ] FEAT-013: Inline comments mode
- [ ] FEAT-014: Explanation depth levels
- [ ] FEAT-015: Code refactoring suggestions

## 🔧 P1 — Quality & Reliability
- [ ] QUA-001: E2E tests with Playwright
- [ ] QUA-002: Visual regression testing
- [ ] QUA-003: API contract testing (OpenAPI)
- [ ] QUA-004: Load testing (k6/Artillery)
- [ ] QUA-005: Error tracking (Sentry)
- [ ] QUA-006: Uptime monitoring/alerting
- [ ] QUA-007: Health check endpoint
- [ ] QUA-008: Database migrations
- [ ] QUA-009: Graceful shutdown handling
- [ ] QUA-010: Request tracing with correlation IDs

## 📱 P2 — Functionality
- [ ] FUNC-001: PWA install prompt
- [ ] FUNC-002: Full offline mode with sync
- [ ] FUNC-003: Browser extension
- [ ] FUNC-004: Public API for programmatic access
- [ ] FUNC-005: SSO authentication (Google, GitHub)
- [ ] FUNC-006: Team/organization accounts
- [ ] FUNC-007: Usage analytics dashboard
- [ ] FUNC-008: Admin panel
- [ ] FUNC-009: Webhook notifications
- [ ] FUNC-010: i18n multi-language UI

## 🧪 P2 — Testing (Carried Over)
- [ ] ATOM-019: Add index for credit_transactions (session_id/created_at)
- [ ] ATOM-201: Unit tests for credits-store
- [ ] ATOM-202: Tests for session cookie signing
- [ ] ATOM-203: Tests for translateRequestSchema
- [ ] ATOM-204: Tests for normalizeLineNumbers
- [ ] ATOM-205: Tests for parseTranslationResponse
- [ ] ATOM-206: Tests for /api/checkout validation
- [ ] ATOM-207: Tests for /api/credits/claim validation
- [ ] ATOM-208: Tests for error mapping
- [ ] ATOM-209: Tests for rate limit

## ✅ Completed (Batch 1)
- [x] ATOM-001 through ATOM-018: Core security, reliability, observability
- [x] ATOM-210, ATOM-211: TypeScript/lint fixes
