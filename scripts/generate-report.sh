#!/usr/bin/env zsh
# ═══════════════════════════════════════════════════════════
#  MATCH REPORT GENERATOR — World Cup 2026
#  Wires together: fotmob.ts (fetch) → generate-report.ts (AI)
#
#  USAGE
#  ─────
#  Single match (auto-detect pre/post):
#    ./scripts/generate-report.sh <match_id> <event_id>
#    ./scripts/generate-report.sh wc26_001 2391728
#
#  Force a specific type:
#    ./scripts/generate-report.sh wc26_001 2391728 post
#
#  Skip re-fetching (reuse existing scraped JSON):
#    ./scripts/generate-report.sh wc26_001 2391728 --skip-fetch
#
#  Re-fetch even if data already exists:
#    ./scripts/generate-report.sh wc26_001 2391728 --force
#
#  List today's World Cup matches (find event IDs):
#    ./scripts/generate-report.sh --list
#    ./scripts/generate-report.sh --list 2026-06-12
#
#  Generate all WC matches for a date:
#    ./scripts/generate-report.sh --bulk
#    ./scripts/generate-report.sh --bulk 2026-06-12
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ─── Paths ───────────────────────────────────────────────
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRAPED="$ROOT/content/scraped"
REPORTS="$ROOT/content/reports"
TSX=(npx tsx)

# ─── Colours ─────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ─── Helpers ─────────────────────────────────────────────
banner() {
  echo ""
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo "${BOLD}${CYAN}  🏟  WORLD CUP 2026 — REPORT GENERATOR${RESET}"
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
}

ok()   { echo "${GREEN}  ✅ $*${RESET}"; }
warn() { echo "${YELLOW}  ⚠️  $*${RESET}"; }
err()  { echo "${RED}  ❌ $*${RESET}"; }
step() { echo "\n${BOLD}$*${RESET}"; }

check_deps() {
  if ! command -v npx &>/dev/null; then
    err "npx not found — install Node.js first"; exit 1
  fi
  if ! command -v claude &>/dev/null; then
    err "claude CLI not found — install Claude Code first"; exit 1
  fi
}

word_count() { wc -w < "$1" | tr -d ' '; }

verify_mdx() {
  local file="$1"
  local label="$2"
  if [[ ! -f "$file" ]]; then
    warn "$label: file not found"
    return 1
  fi
  local size; size=$(wc -c < "$file" | tr -d ' ')
  local words; words=$(word_count "$file")
  if [[ $size -lt 500 ]]; then
    warn "$label: suspiciously small ($size bytes)"
    return 1
  fi
  # Check required MDX parts
  if ! grep -q "^type:" "$file" || ! grep -q "DATA:" "$file"; then
    warn "$label: missing frontmatter or DATA block"
    return 1
  fi
  ok "$label — ${words} words, ${size} bytes"
  return 0
}

# ─── --list mode ─────────────────────────────────────────
cmd_list() {
  local date="${1:-}"
  step "📅 Listing World Cup matches${date:+ for $date}..."
  if [[ -n "$date" ]]; then
    "${TSX[@]}" "$ROOT/scripts/fotmob.ts" --list "$date"
  else
    "${TSX[@]}" "$ROOT/scripts/fotmob.ts" --list
  fi
}

# ─── --bulk mode ─────────────────────────────────────────
cmd_bulk() {
  local date="${1:-}"
  banner

  # Get list of today's matches as JSON-like output
  step "📡 Discovering matches${date:+ for $date}..."
  local list_args=("--list")
  [[ -n "$date" ]] && list_args+=("$date")

  # Capture the list output and parse match_id + event_id pairs
  # The --list output format: "  <event_id>  Team A vs Team B  ..."
  local list_out
  list_out=$("${TSX[@]}" "$ROOT/scripts/fotmob.ts" "${list_args[@]}" 2>&1) || {
    err "Failed to fetch match list"; exit 1
  }

  echo "$list_out"

  # Extract lines that look like "  2391728  Mexico vs South Africa ..."
  local match_lines
  match_lines=$(echo "$list_out" | grep -E '^\s+[0-9]{6,}' || true)

  if [[ -z "$match_lines" ]]; then
    warn "No World Cup matches found for ${date:-today}"
    exit 0
  fi

  local count=0
  local failed=0

  while IFS= read -r line; do
    # Parse: "  2391728  Mexico vs South Africa  19:00:00  [upcoming]"
    local event_id; event_id=$(echo "$line" | awk '{print $1}')
    [[ -z "$event_id" || ! "$event_id" =~ ^[0-9]+$ ]] && continue

    # Derive a match ID — use sequential numbering or fall back to event_id
    local match_id="wc26_event_${event_id}"

    echo ""
    echo "${BOLD}──── Match $((count+1)): event ${event_id} ────${RESET}"

    if run_one "$match_id" "$event_id" "" ""; then
      (( count++ )) || true
    else
      (( failed++ )) || true
    fi
  done <<< "$match_lines"

  echo ""
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo "${GREEN}  Bulk done: ${count} succeeded, ${failed} failed${RESET}"
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo ""
}

# ─── Core: fetch + generate for one match ────────────────
run_one() {
  local match_id="$1"
  local event_id="$2"
  local type_override="$3"   # "pre", "post", or "" for auto
  local flags="$4"           # "--force", "--skip-fetch", or ""

  local skip_fetch=0
  local force=0
  [[ "$flags" == *"--skip-fetch"* ]] && skip_fetch=1
  [[ "$flags" == *"--force"* ]] && force=1

  mkdir -p "$SCRAPED" "$REPORTS"

  # ── Step 1: Fetch ──────────────────────────────────────
  step "📡 Step 1 — Fetch match data (TheSportsDB)"

  # Determine which scraped file to expect
  local pre_file="$SCRAPED/${match_id}-pre.json"
  local post_file="$SCRAPED/${match_id}-post.json"

  local scraped_exists=0
  [[ -f "$pre_file" || -f "$post_file" ]] && scraped_exists=1

  if [[ $skip_fetch -eq 1 ]]; then
    if [[ $scraped_exists -eq 0 ]]; then
      err "--skip-fetch used but no scraped data found for $match_id"
      return 1
    fi
    warn "Skipping fetch — using existing scraped data"
  elif [[ $scraped_exists -eq 1 && $force -eq 0 ]]; then
    warn "Scraped data already exists — skipping fetch (use --force to re-fetch)"
  else
    echo "  Fetching event ${event_id}..."
    if ! "${TSX[@]}" "$ROOT/scripts/fotmob.ts" "$event_id" "$match_id"; then
      err "Fetch failed for event $event_id"
      return 1
    fi
  fi

  # Confirm which file we have now
  local data_type="pre"
  if [[ -f "$post_file" ]]; then
    data_type="post"
  elif [[ ! -f "$pre_file" ]]; then
    err "No scraped data found after fetch step"
    return 1
  fi

  # Type override
  [[ -n "$type_override" ]] && data_type="$type_override"

  local data_file="$SCRAPED/${match_id}-${data_type}.json"
  if [[ ! -f "$data_file" ]]; then
    err "Expected $data_file but it doesn't exist"
    return 1
  fi

  # Show what we fetched
  local home; home=$(python3 -c "import json,sys; d=json.load(open('$data_file')); print(d['general']['homeTeam'])" 2>/dev/null || echo "?")
  local away; away=$(python3 -c "import json,sys; d=json.load(open('$data_file')); print(d['general']['awayTeam'])" 2>/dev/null || echo "?")
  ok "Data: $home vs $away (${data_type}-match)"

  # ── Step 2: Generate reports ───────────────────────────
  step "🤖 Step 2 — Generate reports (Claude haiku)"

  local gen_args=("$ROOT/scripts/generate-report.ts" "$match_id")
  [[ -n "$type_override" ]] && gen_args+=("$type_override")

  if ! "${TSX[@]}" "${gen_args[@]}"; then
    err "Report generation failed"
    return 1
  fi

  # ── Step 3: Verify ─────────────────────────────────────
  step "🔍 Step 3 — Verify"

  local vi_out="$REPORTS/${match_id}-${data_type}-vi.mdx"
  local en_out="$REPORTS/${match_id}-${data_type}-en.mdx"

  local ok_count=0
  verify_mdx "$vi_out" "VI" && (( ok_count++ )) || true
  verify_mdx "$en_out" "EN" && (( ok_count++ )) || true

  if [[ $ok_count -lt 2 ]]; then
    warn "One or more reports may have issues — check manually"
  fi

  apply_to_website "$match_id" "$data_type"
  print_summary "$match_id" "$data_type"
  return 0
}

# ─── Step 4: Apply to website ────────────────────────────
apply_to_website() {
  local match_id="$1"
  local type="$2"
  local vi_url="http://localhost:3000/reports/${match_id}-${type}"
  local en_url="http://localhost:3000/en/reports/${match_id}-${type}"

  step "🌐 Step 4 — Apply to website"

  # Check if Next.js dev server is actually serving HTTP (not just port in use)
  local root_status
  root_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:3000/" 2>/dev/null) || true

  if [[ "$root_status" == "200" || "$root_status" == "308" || "$root_status" == "307" || "$root_status" == "302" ]]; then
    echo "  Dev server running at :3000"

    # Ping the report URL directly
    local http_status
    http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$vi_url" 2>/dev/null) || true

    if [[ "$http_status" == "200" ]]; then
      ok "Live at $vi_url"
      command -v open &>/dev/null && open "$vi_url" && echo "  Opened in browser ↗"
    else
      # Next.js may need a moment to compile new MDX route (first request is slow)
      warn "Route not ready yet (HTTP $http_status) — try opening manually"
      echo "  $vi_url"
    fi
  else
    echo "  ${YELLOW}Dev server not running.${RESET}"
    echo "  Start it: npm run dev"
    echo "  Then visit: $vi_url"
  fi
}

# ─── Summary footer ───────────────────────────────────────
print_summary() {
  local match_id="$1"
  local type="$2"
  local vi_url="http://localhost:3000/reports/${match_id}-${type}"
  local en_url="http://localhost:3000/en/reports/${match_id}-${type}"

  echo ""
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo "${GREEN}${BOLD}  ✅ Report pipeline complete!${RESET}"
  echo ""
  echo "  ${CYAN}VI:${RESET} $vi_url"
  echo "  ${CYAN}EN:${RESET} $en_url"
  echo ""
  echo "  ${CYAN}Publish:${RESET}"
  echo "    git add content/reports/ && git commit -m 'report: ${match_id}-${type}' && git push"
  echo "${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"
  echo ""
}

# ─── Entry point ─────────────────────────────────────────
main() {
  check_deps

  # No args → show help
  if [[ $# -eq 0 ]]; then
    echo "Usage:"
    echo "  ./scripts/generate-report.sh <match_id> <event_id> [pre|post] [--force|--skip-fetch]"
    echo "  ./scripts/generate-report.sh --list [YYYY-MM-DD]"
    echo "  ./scripts/generate-report.sh --bulk [YYYY-MM-DD]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/generate-report.sh wc26_001 2391728"
    echo "  ./scripts/generate-report.sh wc26_001 2391728 post"
    echo "  ./scripts/generate-report.sh wc26_001 2391728 --force"
    echo "  ./scripts/generate-report.sh wc26_001 2391728 --skip-fetch"
    echo "  ./scripts/generate-report.sh --list"
    echo "  ./scripts/generate-report.sh --list 2026-06-12"
    echo "  ./scripts/generate-report.sh --bulk 2026-06-12"
    exit 0
  fi

  case "$1" in
    --list|-l)  cmd_list "${2:-}"; exit 0 ;;
    --bulk|-b)  cmd_bulk "${2:-}"; exit 0 ;;
    --help|-h)  main; exit 0 ;;
  esac

  # Single match mode
  local match_id="$1"
  if [[ -z "${2:-}" ]]; then
    err "Missing event_id"
    echo "  Usage: ./scripts/generate-report.sh <match_id> <event_id>"
    echo "  Run --list to find event IDs"
    exit 1
  fi
  local event_id="$2"
  local type_override=""
  local flags=""

  # Parse remaining args
  for arg in "${@:3}"; do
    case "$arg" in
      pre|post)        type_override="$arg" ;;
      --force)         flags="$flags --force" ;;
      --skip-fetch)    flags="$flags --skip-fetch" ;;
      *) warn "Unknown arg: $arg" ;;
    esac
  done

  banner
  echo "  Match:  $match_id"
  echo "  Event:  $event_id"
  [[ -n "$type_override" ]] && echo "  Type:   $type_override"
  [[ -n "$flags" ]] && echo "  Flags: $flags"

  run_one "$match_id" "$event_id" "$type_override" "$flags"
}

main "$@"
