# Security Checklist

## Production Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | ✅ Yes | 32+ character random string for HMAC session cookies |
| `APP_URL` | ✅ Yes | Production domain (e.g., `https://yourdomain.com`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Stripe webhook signature verification |
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
- [ ] Configure Stripe webhook endpoint in Stripe dashboard
- [ ] Set `STRIPE_WEBHOOK_SECRET` from Stripe webhook settings
- [ ] Test checkout flow in production environment
- [ ] Verify rate limiting is working as expected
