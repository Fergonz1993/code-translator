# Code Translator

Translate code into plain English, line by line. Like Google Translate for programming.

## What It Does

Paste or type code on the left, get plain English explanations on the right. Each line of code gets its own explanation in everyday language.

**Example:**
```typescript
const ratio = delinquent.length / loans.length;
```
→ *"Divide the number of delinquent items by the total number of loans"*

## Supported Languages

- TypeScript
- JavaScript
- Python
- SQL

## Supported AI Models

| Model | Provider | Best For |
|-------|----------|----------|
| GPT-4o Mini | OpenAI | Fast & reliable (default) |
| GPT-4o | OpenAI | Higher quality |
| Gemini 2.0 Flash | Google | Fastest & cheapest |
| Gemini 1.5 Flash | Google | Budget option |
| Claude Haiku | Anthropic | Quick responses |
| Claude Sonnet | Anthropic | Best quality |

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Environment Variables

Copy the example file:
```bash
cp .env.example .env.local
```

Add your API keys (at least one provider):
```
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```

Add server-side credits settings:

```
SESSION_SECRET=replace-with-a-long-random-string
# Optional (defaults to ./data/credits.sqlite)
CREDITS_DB_PATH=./data/credits.sqlite
```

Optional AI resilience tuning:

```
# Provider request timeout (ms)
AI_TIMEOUT_MS=30000
# Retry attempts for transient provider errors
AI_RETRY_ATTEMPTS=2
AI_RETRY_BASE_MS=250
AI_RETRY_MAX_MS=2000
```

Optional server-side cache tuning:

```
# Max in-memory LRU entries (set 0 to disable)
CACHE_LRU_MAX_ENTRIES=1000
```

Optional SQLite tuning:
```
# Busy timeout for SQLite (ms)
SQLITE_BUSY_TIMEOUT_MS=2500
```

### 3. Run the Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Payment Modes

### Credits Mode (Default)
- Uses the app's API keys (from environment variables)
- New users get 20 free credits
- 1 credit = 1 translation

### BYOK Mode (Bring Your Own Key)
- Add your own API key in Settings
- Unlimited translations
- Keys stored locally in your browser and proxied through our server (not stored server-side)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (same as VS Code)
- **AI Providers**: OpenAI, Google Gemini, Anthropic Claude

## Project Structure

```
app/
  page.tsx           # Main split-screen UI
  api/translate/     # AI translation endpoint
components/
  CodePane.tsx       # Monaco editor (left side)
  EnglishPane.tsx    # Translations display (right side)
  SettingsModal.tsx  # Settings & API key management
hooks/
  useSettings.ts     # Payment mode, model selection, API keys
  useCredits.ts      # Credit balance management
  useDebounce.ts     # Delay before auto-translate
lib/
  types.ts           # Shared TypeScript types
```

## Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run start    # Run production build
bun run lint     # Check for code issues
bun run test     # Run tests
```

Testing notes:
- `tests/test-utils.tsx` wraps components with the theme provider and provides `userEvent`.

Sanity scenario:
- Submit a translate request with a valid model and API key; expect a 200 with `translations` and `requestId`, and retries on transient 429/timeout errors. In credits mode, expect a credits consumption log and a refund log if the provider call fails.

API errors:
- Error responses include `error`, `code`, and `requestId` for consistent client handling.

Database:
- Credits ledger includes an index on `credit_transactions(session_id, created_at)` for faster per-session queries.

Observability:
- `/api/translate` logs a structured JSON line with `requestId`, `model`, `provider`, and `latencyMs`.
- Credits usage emits structured JSON logs with `requestId`, `action`, and remaining balance.
- API routes emit structured JSON logs with `route`, `method`, `status`, `requestId`, and `latencyMs`.

## License

MIT
