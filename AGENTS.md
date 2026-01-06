# AGENTS.md

Run this first in new sessions:
`python3 ~/.codex/skills/endless-feature-loop/scripts/resume_loop.py --repo /Users/fernandogonzalez/Code-and-development/CODE-TRANSLATOR-LIVE --set-current`

## RALPH_STATE (SOURCE OF TRUTH)

### North Star Goal
Build the most polished, performant, and secure code translation experience.

### Current Status
- **Batch**: 2
- **Phase**: Fresh Backlog (150+ Features)
- **Last Completed**: ATOM-018 (busy_timeout configured)

---

## 🔒 SECURITY (P0) — 20 Features

| ID | Feature | Status |
|----|---------|--------|
| SEC-001 | Add CSP nonce for inline scripts | ⬜ |
| SEC-002 | Implement SRI for CDN assets | ⬜ |
| SEC-003 | API request signature validation for webhooks | ⬜ |
| SEC-004 | Session rotation after privilege changes | ⬜ |
| SEC-005 | Brute-force protection for API key validation | ⬜ |
| SEC-006 | Prompt injection sanitization for code input | ⬜ |
| SEC-007 | Security headers audit and compliance | ⬜ |
| SEC-008 | API versioning for breaking changes | ⬜ |
| SEC-009 | CORS policy hardening | ⬜ |
| SEC-010 | JWT token rotation and refresh | ⬜ |
| SEC-011 | SQL injection prevention audit | ⬜ |
| SEC-012 | XSS protection with DOMPurify | ⬜ |
| SEC-013 | Secure cookie attributes (SameSite, Partitioned) | ⬜ |
| SEC-014 | API key scoping (read-only vs full access) | ⬜ |
| SEC-015 | IP-based rate limiting | ⬜ |
| SEC-016 | Suspicious activity detection and blocking | ⬜ |
| SEC-017 | OWASP ZAP integration for automated scans | ⬜ |
| SEC-018 | Dependency vulnerability scanning (Snyk) | ⬜ |
| SEC-019 | Secret rotation automation | ⬜ |
| SEC-020 | Penetration testing documentation | ⬜ |

---

## ⚡ PERFORMANCE (P0) — 25 Features

| ID | Feature | Status |
|----|---------|--------|
| PERF-001 | Edge Functions for lower latency | ⬜ |
| PERF-002 | Redis caching layer for translations | ⬜ |
| PERF-003 | Lazy load Monaco editor | ⬜ |
| PERF-004 | Request coalescing for duplicate calls | ⬜ |
| PERF-005 | WebSocket streaming translations | ⬜ |
| PERF-006 | Dynamic imports for bundle optimization | ⬜ |
| PERF-007 | Translation queue for batch processing | ⬜ |
| PERF-008 | Database connection pooling | ⬜ |
| PERF-009 | Preload fonts / reduce CLS | ⬜ |
| PERF-010 | Memory profiling and leak detection | ⬜ |
| PERF-011 | Image optimization with next/image | ⬜ |
| PERF-012 | Route prefetching for navigation | ⬜ |
| PERF-013 | Service worker caching strategies | ⬜ |
| PERF-014 | Brotli compression for assets | ⬜ |
| PERF-015 | HTTP/3 and QUIC support | ⬜ |
| PERF-016 | CDN edge caching for static assets | ⬜ |
| PERF-017 | Code splitting by route | ⬜ |
| PERF-018 | Tree shaking optimization | ⬜ |
| PERF-019 | React Server Components for SSR | ⬜ |
| PERF-020 | Suspense boundaries for streaming | ⬜ |
| PERF-021 | IndexedDB for client-side caching | ⬜ |
| PERF-022 | Web Workers for CPU-intensive tasks | ⬜ |
| PERF-023 | requestIdleCallback for non-critical work | ⬜ |
| PERF-024 | Lighthouse CI integration | ⬜ |
| PERF-025 | Real User Monitoring (RUM) metrics | ⬜ |

---

## 🎨 DESIGN & UX (P1) — 30 Features

| ID | Feature | Status |
|----|---------|--------|
| DES-001 | Syntax-highlighted explanations | ⬜ |
| DES-002 | Side-by-side diff view | ⬜ |
| DES-003 | Collapsible sections for long explanations | ⬜ |
| DES-004 | Responsive tablet layout | ⬜ |
| DES-005 | Animated loading progress | ⬜ |
| DES-006 | Drag-to-resize panes | ⬜ |
| DES-007 | Code folding sync with explanations | ⬜ |
| DES-008 | Custom scrollbar styles | ⬜ |
| DES-009 | High-contrast accessibility theme | ⬜ |
| DES-010 | Keyboard focus indicators | ⬜ |
| DES-011 | Print-friendly stylesheet | ⬜ |
| DES-012 | Onboarding video/animation | ⬜ |
| DES-013 | Minimap for long code files | ⬜ |
| DES-014 | Line number gutter styling | ⬜ |
| DES-015 | Custom syntax themes (10+) | ⬜ |
| DES-016 | Zen mode (distraction-free) | ⬜ |
| DES-017 | Split view horizontal/vertical toggle | ⬜ |
| DES-018 | Breadcrumb navigation for nested code | ⬜ |
| DES-019 | Sticky header on scroll | ⬜ |
| DES-020 | Skeleton loading states | ⬜ |
| DES-021 | Glassmorphism UI elements | ⬜ |
| DES-022 | Micro-interactions and haptic feedback | ⬜ |
| DES-023 | Custom fonts selection | ⬜ |
| DES-024 | Font size/line height controls | ⬜ |
| DES-025 | Word wrap toggle | ⬜ |
| DES-026 | Show invisible characters | ⬜ |
| DES-027 | Column guides | ⬜ |
| DES-028 | Indent guides | ⬜ |
| DES-029 | Active line highlighting | ⬜ |
| DES-030 | Matched bracket highlighting | ⬜ |

---

## ✨ FEATURES (P1) — 40 Features

| ID | Feature | Status |
|----|---------|--------|
| FEAT-001 | Multi-file/project translation | ⬜ |
| FEAT-002 | Code snippets library | ⬜ |
| FEAT-003 | Translation comparison (multiple models) | ⬜ |
| FEAT-004 | Collaborative sharing with live links | ⬜ |
| FEAT-005 | Export to PDF with formatting | ⬜ |
| FEAT-006 | Translation templates | ⬜ |
| FEAT-007 | Line-by-line highlighting sync | ⬜ |
| FEAT-008 | Translation bookmarks | ⬜ |
| FEAT-009 | Code complexity analysis | ⬜ |
| FEAT-010 | Voice narration of explanations | ⬜ |
| FEAT-011 | Support for Go | ⬜ |
| FEAT-012 | Support for Rust | ⬜ |
| FEAT-013 | Support for Java | ⬜ |
| FEAT-014 | Support for C/C++ | ⬜ |
| FEAT-015 | Support for C# | ⬜ |
| FEAT-016 | Support for Ruby | ⬜ |
| FEAT-017 | Support for PHP | ⬜ |
| FEAT-018 | Support for Swift | ⬜ |
| FEAT-019 | Support for Kotlin | ⬜ |
| FEAT-020 | Support for Scala | ⬜ |
| FEAT-021 | VS Code extension | ⬜ |
| FEAT-022 | JetBrains plugin | ⬜ |
| FEAT-023 | Inline comments mode | ⬜ |
| FEAT-024 | Explanation depth levels (beginner/expert) | ⬜ |
| FEAT-025 | Code refactoring suggestions | ⬜ |
| FEAT-026 | Bug detection and warnings | ⬜ |
| FEAT-027 | Security vulnerability detection | ⬜ |
| FEAT-028 | Performance suggestion hints | ⬜ |
| FEAT-029 | Code documentation generator | ⬜ |
| FEAT-030 | README generator from code | ⬜ |
| FEAT-031 | Unit test generator | ⬜ |
| FEAT-032 | Code review assistant | ⬜ |
| FEAT-033 | Git diff translation | ⬜ |
| FEAT-034 | GitHub PR integration | ⬜ |
| FEAT-035 | GitLab MR integration | ⬜ |
| FEAT-036 | Slack bot for translations | ⬜ |
| FEAT-037 | Discord bot | ⬜ |
| FEAT-038 | CLI tool for translations | ⬜ |
| FEAT-039 | Regex explanation mode | ⬜ |
| FEAT-040 | SQL query explanation with visuals | ⬜ |

---

## 🔧 QUALITY & RELIABILITY (P1) — 25 Features

| ID | Feature | Status |
|----|---------|--------|
| QUA-001 | E2E tests with Playwright | ⬜ |
| QUA-002 | Visual regression testing | ⬜ |
| QUA-003 | API contract testing (OpenAPI) | ⬜ |
| QUA-004 | Load testing (k6/Artillery) | ⬜ |
| QUA-005 | Error tracking (Sentry) | ⬜ |
| QUA-006 | Uptime monitoring (Pingdom) | ⬜ |
| QUA-007 | Health check endpoint | ⬜ |
| QUA-008 | Database migration system | ⬜ |
| QUA-009 | Graceful shutdown handling | ⬜ |
| QUA-010 | Request tracing with correlation IDs | ⬜ |
| QUA-011 | Distributed tracing (OpenTelemetry) | ⬜ |
| QUA-012 | Metrics dashboard (Grafana) | ⬜ |
| QUA-013 | Log aggregation (Loki/ELK) | ⬜ |
| QUA-014 | Alerting rules and notifications | ⬜ |
| QUA-015 | Canary deployments | ⬜ |
| QUA-016 | Feature flag gradual rollouts | ⬜ |
| QUA-017 | A/B testing infrastructure | ⬜ |
| QUA-018 | Chaos engineering tests | ⬜ |
| QUA-019 | Backup and restore procedures | ⬜ |
| QUA-020 | Disaster recovery plan | ⬜ |
| QUA-021 | SLA monitoring | ⬜ |
| QUA-022 | Incident response runbooks | ⬜ |
| QUA-023 | Post-mortem templates | ⬜ |
| QUA-024 | Code coverage (90%+ target) | ⬜ |
| QUA-025 | Mutation testing | ⬜ |

---

## 📱 FUNCTIONALITY (P2) — 30 Features

| ID | Feature | Status |
|----|---------|--------|
| FUNC-001 | PWA install prompt | ⬜ |
| FUNC-002 | Full offline mode with sync | ⬜ |
| FUNC-003 | Browser extension (Chrome) | ⬜ |
| FUNC-004 | Browser extension (Firefox) | ⬜ |
| FUNC-005 | Browser extension (Safari) | ⬜ |
| FUNC-006 | Public REST API | ⬜ |
| FUNC-007 | GraphQL API | ⬜ |
| FUNC-008 | SSO with Google | ⬜ |
| FUNC-009 | SSO with GitHub | ⬜ |
| FUNC-010 | SSO with Microsoft | ⬜ |
| FUNC-011 | Team accounts | ⬜ |
| FUNC-012 | Organization billing | ⬜ |
| FUNC-013 | Usage analytics dashboard | ⬜ |
| FUNC-014 | Admin panel | ⬜ |
| FUNC-015 | Webhook notifications | ⬜ |
| FUNC-016 | i18n - Spanish | ⬜ |
| FUNC-017 | i18n - French | ⬜ |
| FUNC-018 | i18n - German | ⬜ |
| FUNC-019 | i18n - Japanese | ⬜ |
| FUNC-020 | i18n - Chinese | ⬜ |
| FUNC-021 | i18n - Portuguese | ⬜ |
| FUNC-022 | Custom domain support | ⬜ |
| FUNC-023 | White-label solution | ⬜ |
| FUNC-024 | API key management dashboard | ⬜ |
| FUNC-025 | Usage quotas and limits | ⬜ |
| FUNC-026 | Billing portal integration | ⬜ |
| FUNC-027 | Invoice generation | ⬜ |
| FUNC-028 | Referral program | ⬜ |
| FUNC-029 | Affiliate tracking | ⬜ |
| FUNC-030 | Enterprise SSO (SAML) | ⬜ |

---

## 🧪 TESTING BACKLOG (P2) — 10 Features

| ID | Feature | Status |
|----|---------|--------|
| ATOM-019 | Add index for credit_transactions | ⬜ |
| ATOM-201 | Unit tests for credits-store | ⬜ |
| ATOM-202 | Tests for session cookie signing | ⬜ |
| ATOM-203 | Tests for translateRequestSchema | ⬜ |
| ATOM-204 | Tests for normalizeLineNumbers | ⬜ |
| ATOM-205 | Tests for parseTranslationResponse | ⬜ |
| ATOM-206 | Tests for /api/checkout validation | ⬜ |
| ATOM-207 | Tests for /api/credits/claim validation | ⬜ |
| ATOM-208 | Tests for error mapping | ⬜ |
| ATOM-209 | Tests for rate limit | ⬜ |

---

## 📊 SUMMARY

| Category | Count |
|----------|-------|
| 🔒 Security | 20 |
| ⚡ Performance | 25 |
| 🎨 Design & UX | 30 |
| ✨ Features | 40 |
| 🔧 Quality | 25 |
| 📱 Functionality | 30 |
| 🧪 Testing | 10 |
| **TOTAL** | **180** |

---

## ✅ COMPLETED (Previous Batch)

<details>
<summary>Show completed features from Batch 1</summary>

- ATOM-001: Force nodejs runtime for native dependencies
- ATOM-002: Derive aiModelSchema from AVAILABLE_MODELS
- ATOM-003: Validate /api/checkout request with Zod
- ATOM-004: Validate /api/credits/claim query param with Zod
- ATOM-005: API error helper with consistent requestId
- ATOM-006: Add requestId to /api/translate responses
- ATOM-007: Use APP_URL for Stripe checkout redirects
- ATOM-008: Validate Origin/Referer allowlist
- ATOM-009: Session-based rate limiting for /api/translate
- ATOM-010: Reject suspicious BYOK API key formats
- ATOM-011: Provider timeout for /api/translate
- ATOM-012: Retry with backoff for transient errors
- ATOM-013: Map provider errors to stable status codes
- ATOM-014: Log latency and model in /api/translate
- ATOM-015: Log credit consumption/refunds with requestId
- ATOM-016: Structured logging helper for API routes
- ATOM-017: Server-side LRU cache for translations
- ATOM-018: Configure SQLite busy_timeout
- ATOM-210: Fix TypeScript parse errors in test-utils.ts
- ATOM-211: Fix lint errors in components

</details>

---

## Definition of Done (DoD)

- [ ] Implemented
- [ ] Tests added/updated
- [ ] All tests pass (`bun test`)
- [ ] Lint/typecheck/build pass
- [ ] Docs updated if needed
- [ ] Verified in browser

---

## Learnings & Notes

- better-sqlite3 requires `npm rebuild better-sqlite3` after Node changes
- `next build` needs `SESSION_SECRET=local-dev` for verification
- 200 features completed in previous turbo-loop
- 55/55 tests passing, lint clean

---

## Next Action

Start from **SEC-001** or use `/turbo-loop "security hardening"` to begin.
