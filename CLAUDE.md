# CLAUDE.md

> [!IMPORTANT]
> **🔄 ON EVERY NEW SESSION: Check `AGENT_STATE.md` FIRST!**
> - If Mode is `RUNNING` or `PAUSED` → Resume immediately, no questions asked
> - User can say: `resume`, `continue`, `go`, or `/turbo-loop` to trigger
> - If user sends empty or unclear message, check AGENT_STATE.md anyway

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Code Translator is a Next.js 16 application that translates code into plain English, line by line. Think "Google Translate for programming." Users paste code on the left, and AI-generated explanations appear on the right in real-time.

## Commands

```bash
# Development
bun install          # Install dependencies
bun run dev          # Start dev server (localhost:3000)
bun run build        # Production build
bun run lint         # Run ESLint
```

## Architecture

### Data Flow
```
User types code → 800ms debounce → POST /api/translate → AI Provider → JSON response → Display
```

### Key Layers

**Frontend (app/page.tsx)**
- Split-screen layout: Monaco Editor (left) + English translations (right)
- State managed via custom hooks, persisted to localStorage
- Auto-translates after 800ms debounce

**API Route (app/api/translate/route.ts)**
- Unified endpoint for all AI providers
- Determines provider from model name prefix (gpt-*, gemini-*, claude-*)
- Two modes: Credits (our keys) or BYOK (user's keys)

**Custom Hooks (hooks/)**
- `useSettings`: Payment mode, selected model, BYOK API keys (localStorage)
- `useCredits`: Credit balance tracking (localStorage)
- `useDebounce`: 800ms delay before translation

### Payment Modes
1. **Credits mode**: Uses server-side API keys from environment variables, deducts 1 credit per translation
2. **BYOK mode**: User provides their own API key, stored locally and proxied through the server (never stored server-side)

### Supported AI Models
| Model ID | Provider | Notes |
|----------|----------|-------|
| gpt-4o-mini | OpenAI | Default, recommended |
| gpt-4o | OpenAI | Higher quality |
| gemini-2.0-flash | Google | Fastest, cheapest |
| gemini-1.5-flash | Google | Alternative |
| claude-haiku | Anthropic | Fast |
| claude-sonnet | Anthropic | Best quality |

### Type System
All shared types are in `lib/types.ts`:
- `AIModel`, `AIProvider`, `PaymentMode`: Core enums
- `TranslateRequest`, `TranslatedLine`: API contract
- `UserSettings`, `CreditsState`: localStorage schemas

## Environment Variables

For Credits mode (server-side API keys):
```
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```

For server-side sessions and credits:
```
SESSION_SECRET=replace-with-a-long-random-string
# Optional (defaults to ./data/credits.sqlite)
CREDITS_DB_PATH=./data/credits.sqlite
```

## Code Style

This codebase uses extensive section comments (`// ===== SECTION NAME =====`) to make the code readable for non-programmers. Maintain this pattern when adding new code.

Components and hooks include explanatory comments describing what they do and why.
