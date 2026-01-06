#!/bin/bash
# turbo-resume.sh - Resume autonomous loop after compact/new session
# Usage: ./turbo-resume.sh [optional-goal]

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_FILE="$PROJECT_DIR/AGENT_STATE.md"

# Check if state file exists
if [ ! -f "$STATE_FILE" ]; then
    echo "❌ AGENT_STATE.md not found. Run /turbo-loop first."
    exit 1
fi

# Extract current mode
MODE=$(grep -E "^\- \*\*Mode\*\*:" "$STATE_FILE" | sed 's/.*`\(.*\)`.*/\1/')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 TURBO LOOP STATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show current state
echo "📊 Mode: $MODE"
grep -E "^\- \*\*Goal\*\*:" "$STATE_FILE"
echo ""

# Count features
TOTAL=$(grep -cE "^\- \[.\]" "$STATE_FILE" 2>/dev/null || echo 0)
DONE=$(grep -cE "^\- \[x\]" "$STATE_FILE" 2>/dev/null || echo 0)
PENDING=$(grep -cE "^\- \[ \]" "$STATE_FILE" 2>/dev/null || echo 0)

echo "📈 Progress: $DONE/$TOTAL complete ($PENDING pending)"
echo ""

# Show next feature
NEXT=$(grep -m1 -E "^\- \[ \]" "$STATE_FILE" | sed 's/- \[ \] //')
if [ -n "$NEXT" ]; then
    echo "⏭️  Next: $NEXT"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate prompt for agent
if [ "$MODE" = "RUNNING" ] || [ "$MODE" = "PAUSED" ]; then
    PROMPT="Check AGENT_STATE.md and resume the turbo-loop. Continue from where we left off."
elif [ -n "$1" ]; then
    PROMPT="/turbo-loop \"$1\""
else
    PROMPT="Check AGENT_STATE.md. If there's a paused loop, resume it. Otherwise, ask what goal I want to work on."
fi

echo "📋 Suggested prompt to paste:"
echo ""
echo "   $PROMPT"
echo ""

# Copy to clipboard if pbcopy available (macOS)
if command -v pbcopy &> /dev/null; then
    echo "$PROMPT" | pbcopy
    echo "✅ Copied to clipboard!"
fi
