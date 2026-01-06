---
description: Autonomous loop that works through atomic features until completion
---

# /turbo-loop - Autonomous Feature Loop

// turbo-all

## Activation

User says: `/turbo-loop "goal description"` or just `/turbo-loop` (goal inferred from context)

## Protocol

### Phase 1: Initialization

1. Read `AGENT_STATE.md` in project root
2. If Mode is RUNNING → resume from current feature
3. If Mode is IDLE:
   - Analyze the project structure and goal
   - Generate **atomic, granular feature list** (10-30 items typically)
   - Features must be:
     - Single-responsibility (one thing per feature)
     - Testable (has clear verification criteria)
     - Ordered logically (dependencies first)
   - Update AGENT_STATE.md with:
     - Mode: RUNNING
     - Goal: the objective
     - Feature Queue: the list
     - Started: current timestamp

### Phase 2: Execution Loop

For each feature in queue:

1. **Mark In-Progress**: `[ ]` → `[/]` in AGENT_STATE.md
2. **Implement**: Write code, create files, make changes
3. **Verify**: Run tests, lint, build, or manual verification
4. **Log Result**: Add to Verification Log with ✅ or ❌
5. **Mark Complete**: `[/]` → `[x]`
6. **Update AGENT_STATE.md**: Last Updated timestamp
7. **Continue**: Move to next `[ ]` feature

### Phase 3: Regeneration

When ALL features are `[x]`:

1. Evaluate if goal is truly complete
2. If more work needed:
   - Generate NEW atomic feature list
   - Append to queue or replace
   - Continue loop
3. If goal complete:
   - Set Mode: COMPLETED
   - Generate final summary

## Example Feature List

For "improve backend security":

```markdown
## Feature Queue
- [ ] Add rate limiting middleware to /api/translate
- [ ] Validate Origin header on credit-consuming endpoints
- [ ] Add request size limits with Zod schemas
- [ ] Implement IP-based throttling
- [ ] Add CSRF protection tokens
- [ ] Create security audit tests
- [ ] Add helmet-style security headers
- [ ] Implement request logging for abuse detection
- [ ] Add honeypot endpoints for bot detection
- [ ] Create security documentation
```

## State Persistence

The `AGENT_STATE.md` file is designed to survive:
- `/compact` commands (conversation compression)
- New chat sessions
- Context window limits

**Always check AGENT_STATE.md first** when starting any conversation.

## Commands

- `/turbo-loop "goal"` - Start new loop with goal
- `/turbo-loop` - Resume existing or start contextual
- `/turbo-pause` - Set Mode: PAUSED
- `/turbo-status` - Show current state
- `/turbo-stop` - Set Mode: IDLE, clear queue

## Verification Standards

Each feature MUST be verified before marking complete:
- Code compiles: `bun run build`
- Tests pass: `bun run test`
- Lint clean: `bun run lint`
- Feature-specific tests added when applicable
