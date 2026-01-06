# GEMINI.md

> [!IMPORTANT]
> **🔄 ON EVERY NEW SESSION: Check `AGENT_STATE.md` FIRST!**
> - If Mode is `RUNNING` or `PAUSED` → Resume immediately, no questions asked
> - User can say: `resume`, `continue`, `go`, or `/turbo-loop` to trigger
> - If user sends empty or unclear message, check AGENT_STATE.md anyway

This file provides guidance to Gemini/Antigravity when working with this repository.

## Project Overview

Code Translator is a Next.js 16 application that translates code into plain English, line by line. Users paste code on the left, and AI-generated explanations appear on the right in real-time.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (localhost:3000)
bun run build        # Production build
bun run test         # Run tests
bun run lint         # Run ESLint
```

## Autonomous Loop Protocol

See `.agent/workflows/turbo-loop.md` for full protocol.

### Quick Start

- `/turbo-loop "goal"` - Start autonomous feature loop
- `/turbo-status` - Check progress
- `/turbo-pause` - Pause loop
- `/turbo-stop` - Stop and reset

### State File

`AGENT_STATE.md` persists loop state across sessions. **Always check it first.**

## Architecture

### Key Files

- `app/page.tsx` - Main UI (split-screen Monaco + explanations)
- `app/api/translate/route.ts` - AI provider router
- `lib/credits-store.ts` - SQLite credits ledger
- `lib/types.ts` - Shared TypeScript types
- `lib/schemas.ts` - Zod validation schemas

### AI Providers

- OpenAI: gpt-4o-mini, gpt-4o
- Google: gemini-2.0-flash, gemini-1.5-flash
- Anthropic: claude-haiku, claude-sonnet

## Security Environment Variables

**Required in Production:**

```bash
SESSION_SECRET=your-32-char-secret   # Required for session cookies
APP_URL=https://yourdomain.com       # Required for Stripe redirects
STRIPE_WEBHOOK_SECRET=whsec_...      # Required for payment verification
```

**Optional:**

```bash
ALLOWED_ORIGINS=https://alt-domain.com  # Additional allowed CORS origins
```
