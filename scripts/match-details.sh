#!/usr/bin/env zsh
# ═══════════════════════════════════════════════════════════
#  MATCH DETAILS PIPELINE — World Cup 2026
#  fotmob.ts (fetch) → generate-match-details.ts (write) → git push
#
#  USAGE
#  ─────
#  List today's matches (find event IDs):
#    ./scripts/match-details.sh --list
#    ./scripts/match-details.sh --list 2026-06-12
#
#  Full pipeline — fetch + generate + push:
#    ./scripts/match-details.sh <match_id> <event_id>
#    ./scripts/match-details.sh wc26_001 2391728
#
#  Pre-match only (lineups, no incidents):
#    ./scripts/match-details.sh wc26_001 2391728 --pre
#
#  Skip re-fetching (reuse existing scraped JSON):
#    ./scripts/match-details.sh wc26_001 2391728 --skip-fetch
#
#  Re-fetch even if scraped data already exists:
#    ./scripts/match-details.sh wc26_001 2391728 --force
#
#  Generate details but don't push to git:
#    ./scripts/match-details.sh wc26_001 2391728 --no-push
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ─── Paths ────────────────────────────────────────────────
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRAPED="$ROOT/content/scraped"
DETAILS="$ROOT/content/match-details"
TSX=(npx tsx)

# ─── Colours ──────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ─── Helpers ──────────────────────────────────────────────
banner() {
  echo ""
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo "${BOLD}${CYAN}  ⚽  WORLD CUP 2026 — MATCH DETAILS PIPELINE${RESET}"
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
}

ok()   { echo "${GREEN}  ✅ $*${RESET}"; }
warn() { echo "${YELLOW}  ⚠️  $*${RESET}"; }
err()  { echo "${RED}  ❌ $*${RESET}"; exit 1; }
step() { echo "\n${BOLD}$*${RESET}"; }

check_deps() {
  command -v npx &>/dev/null || err "npx not found — install Node.js first"
}

# ─── --list mode ──────────────────────────────────────────
cmd_list() {
  local date="${1:-}"
  step "📅 Listing World Cup matches${date:+ for $date}..."
  if [[ -n "$date" ]]; then
    "${TSX[@]}" "$ROOT/scripts/fotmob.ts" --list "$date"
  else
    "${TSX[@]}" "$ROOT/scripts/fotmob.ts" --list
  fi
}

# ─── Core pipeline ────────────────────────────────────────
run_pipeline() {
  local match_id="$1"
  local event_id="$2"
  local mode="${3:-post}"       # "pre" or "post"
  local skip_fetch="${4:-0}"
  local force="${5:-0}"
  local no_push="${6:-0}"

  mkdir -p "$SCRAPED" "$DETAILS"

  # ── Step 1: Fetch ─────────────────────────────────────
  step "📡 Step 1 — Fetch match data (TheSportsDB)"

  local pre_file="$SCRAPED/${match_id}-pre.json"
  local post_file="$SCRAPED/${match_id}-post.json"
  local scraped_exists=0
  [[ -f "$pre_file" || -f "$post_file" ]] && scraped_exists=1

  if [[ $skip_fetch -eq 1 ]]; then
    [[ $scraped_exists -eq 0 ]] && err "--skip-fetch used but no scraped data found for $match_id"
    warn "Skipping fetch — reusing existing scraped data"
  elif [[ $scraped_exists -eq 1 && $force -eq 0 ]]; then
    warn "Scraped data exists — skipping fetch (use --force to re-fetch)"
  else
    echo "  Fetching event ${event_id}..."
    "${TSX[@]}" "$ROOT/scripts/fotmob.ts" "$event_id" "$match_id" \
      || err "Fetch failed for event $event_id"
  fi

  # Detect which file we have
  local data_type="pre"
  [[ -f "$post_file" ]] && data_type="post"
  [[ $mode == "pre" ]] && data_type="pre"

  local data_file="$SCRAPED/${match_id}-${data_type}.json"
  [[ -f "$data_file" ]] || err "No scraped data found at $data_file"

  local home away
  home=$(python3 -c "import json; d=json.load(open('$data_file')); print(d['general']['homeTeam'])" 2>/dev/null || echo "?")
  away=$(python3 -c "import json; d=json.load(open('$data_file')); print(d['general']['awayTeam'])" 2>/dev/null || echo "?")
  ok "Data: $home vs $away (${data_type}-match)"

  # ── Step 2: Generate match-details JSON ───────────────
  step "⚙️  Step 2 — Generate match-details JSON"

  if [[ "$data_type" == "post" ]]; then
    "${TSX[@]}" "$ROOT/scripts/generate-match-details.ts" "$match_id" --post \
      || err "generate-match-details failed for $match_id"
  else
    "${TSX[@]}" "$ROOT/scripts/generate-match-details.ts" "$match_id" \
      || err "generate-match-details failed for $match_id"
  fi

  local out_file="$DETAILS/${match_id}.json"
  [[ -f "$out_file" ]] || err "Expected output not found: $out_file"

  local incidents
  incidents=$(python3 -c "import json; d=json.load(open('$out_file')); print(len(d.get('incidents', [])))" 2>/dev/null || echo "?")
  ok "Written: content/match-details/${match_id}.json (${incidents} incidents)"

  # ── Step 3: Commit & push ─────────────────────────────
  if [[ $no_push -eq 1 ]]; then
    step "⏭  Step 3 — Skipping git push (--no-push)"
  else
    step "🚀 Step 3 — Commit & push"
    cd "$ROOT"

    if git diff --quiet "content/match-details/${match_id}.json" 2>/dev/null \
       && ! git ls-files --others --exclude-standard "content/match-details/${match_id}.json" | grep -q .; then
      warn "No changes in match-details/${match_id}.json — nothing to commit"
    else
      git add "content/match-details/${match_id}.json"
      git commit -m "feat(match-details): update incidents for ${match_id} (${home} vs ${away})"
      git push
      ok "Pushed to remote — site will redeploy"
    fi
  fi

  # ── Summary ───────────────────────────────────────────
  echo ""
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo "${GREEN}${BOLD}  ✅ Pipeline complete!${RESET}"
  echo ""
  echo "  ${CYAN}File:${RESET}  content/match-details/${match_id}.json"
  echo "  ${CYAN}Match:${RESET} $home vs $away"
  if [[ $no_push -ne 1 ]]; then
    echo "  ${CYAN}Live:${RESET}  changes pushed — deployment triggered"
  fi
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo ""
}

# ─── Entry point ──────────────────────────────────────────
main() {
  check_deps

  if [[ $# -eq 0 ]]; then
    echo "Usage:"
    echo "  ./scripts/match-details.sh --list [YYYY-MM-DD]"
    echo "  ./scripts/match-details.sh <match_id> <event_id> [--pre] [--force|--skip-fetch] [--no-push]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/match-details.sh --list"
    echo "  ./scripts/match-details.sh --list 2026-06-12"
    echo "  ./scripts/match-details.sh wc26_001 2391728"
    echo "  ./scripts/match-details.sh wc26_001 2391728 --force"
    echo "  ./scripts/match-details.sh wc26_001 2391728 --skip-fetch --no-push"
    echo "  ./scripts/match-details.sh wc26_001 2391728 --pre"
    exit 0
  fi

  case "$1" in
    --list|-l)     cmd_list "${2:-}"; exit 0 ;;
    --list-all)    "${TSX[@]}" "$ROOT/scripts/fotmob.ts" --list-all "${2:-}"; exit 0 ;;
    --help|-h)     main; exit 0 ;;
  esac

  local match_id="$1"
  [[ -z "${2:-}" ]] && err "Missing event_id — run --list to find it"
  local event_id="$2"

  local mode="post"
  local skip_fetch=0
  local force=0
  local no_push=0

  for arg in "${@:3}"; do
    case "$arg" in
      --pre)         mode="pre" ;;
      --force)       force=1 ;;
      --skip-fetch)  skip_fetch=1 ;;
      --no-push)     no_push=1 ;;
      *) warn "Unknown arg: $arg" ;;
    esac
  done

  banner
  echo "  Match:  $match_id"
  echo "  Event:  $event_id"
  echo "  Mode:   $mode"

  run_pipeline "$match_id" "$event_id" "$mode" "$skip_fetch" "$force" "$no_push"
}

main "$@"
