#!/bin/zsh
# Daily WC2026 sync — called by launchd/cron at 7 AM
set -e

cd /Users/flutter-tri/personal/lichworldcup2026

# Ensure node/npm in PATH (handles nvm installs)
export NVM_DIR="$HOME/.nvm"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

LOG="/tmp/wc26-sync-$(date +%Y-%m-%d).log"
exec > "$LOG" 2>&1

echo "=== WC2026 sync $(date) ==="
npx tsx scripts/sync.ts
echo "=== Done $(date) ==="
