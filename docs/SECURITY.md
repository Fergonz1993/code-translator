# Security Checklist

## Production Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | ✅ Yes | 32+ character random string for HMAC session cookies |
| `APP_URL` | ✅ Yes | Production domain (e.g., `https://yourdomain.com`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes (if selling credits) | Stripe publishable key for client-side checkout |
| `STRIPE_SECRET_KEY` | ✅ Yes (if selling credits) | Stripe secret key for creating checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes (if selling credits) | Stripe webhook signature verification |
| `CREDITS_DB_PATH` | ❌ Optional | SQLite path for credits ledger (defaults to `./data/credits.sqlite`) |
| `CACHE_DB_PATH` | ❌ Optional | SQLite path for translation cache (defaults to `./data/cache.sqlite`) |
| `ALLOWED_ORIGINS` | ❌ Optional | Additional allowed CORS origins (comma-separated) |

## Security Features

### Implemented ✅

- **Runtime Config**: All API routes use `runtime = "nodejs"` for SQLite compatibility
- **Session Cookies**: HMAC-signed, httpOnly, secure in production
- **APP_URL Validation**: Checkout URLs use trusted env var, not client header
- **Rate Limiting**: 60 req/min (credits mode), 120 req/min (BYOK mode)
- **Zod Validation**: Request schemas for all POST endpoints
- **Stripe Webhook Verification**: Signature validation on payment webhooks
- **Idempotency**: Credit transactions use idempotency keys

### Origin Validation

The `lib/security.ts` module provides:
- Origin header validation against allowed origins
- Referer fallback for same-origin requests
- Development mode flexibility

## Pre-Deployment Checklist

- [ ] Set `SESSION_SECRET` to a unique 32+ character string
- [ ] Set `APP_URL` to your production domain
- [ ] Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (required to open Stripe Checkout)
- [ ] Set `STRIPE_SECRET_KEY` (required to create checkout sessions)
- [ ] Configure Stripe webhook endpoint in Stripe dashboard
- [ ] Set `STRIPE_WEBHOOK_SECRET` from Stripe webhook settings
- [ ] Test checkout flow in production environment
- [ ] Verify rate limiting is working as expected
