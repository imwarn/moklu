#!/usr/bin/env bash
#
# One-shot post-deploy verification for https://moklu.app/
#
# Answers three questions a bare "tests passed" cannot:
#   1. Is the deployment actually the build we think it is?  (bundle identity)
#   2. Did the release-blocking defects actually go away?    (live probes)
#   3. Are the security headers live?                        (response headers)
#
# Every probe prints the measured value, so a run against the pre-fix build
# produces a different table than a run against the fixed one. A green run is
# only meaningful because a red one is possible.
#
# Usage:
#   scripts/verify-deploy.sh                       # verify production
#   scripts/verify-deploy.sh http://localhost:4174 # verify a local build
#   scripts/verify-deploy.sh --no-browser          # skip Playwright suites

set -uo pipefail

TARGET="${1:-https://moklu.app}"
if [[ "$TARGET" == --* ]]; then TARGET="https://moklu.app"; fi
SKIP_BROWSER=0
for arg in "$@"; do [[ "$arg" == "--no-browser" ]] && SKIP_BROWSER=1; done

OUT_DIR="release-evidence/verify"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
REPORT="$OUT_DIR/verify-$STAMP.txt"

PASS=0; FAIL=0; WARN=0
declare -a ROWS

c_pass() { PASS=$((PASS+1)); ROWS+=("PASS|$1|$2"); printf '  \033[32m✓\033[0m %-34s %s\n' "$1" "$2"; }
c_fail() { FAIL=$((FAIL+1)); ROWS+=("FAIL|$1|$2"); printf '  \033[31m✗\033[0m %-34s %s\n' "$1" "$2"; }
c_warn() { WARN=$((WARN+1)); ROWS+=("WARN|$1|$2"); printf '  \033[33m!\033[0m %-34s %s\n' "$1" "$2"; }
hdr()    { printf '\n\033[1m%s\033[0m\n' "$1"; }

echo "Moklu deploy verification"
echo "target : $TARGET"
echo "when   : $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "report : $REPORT"

curl_json() { if command -v jq >/dev/null 2>&1; then jq -r "$1" 2>/dev/null; else python3 -c "
import json,sys
d=json.load(sys.stdin)
print(eval('$1'.replace('.',\"['\").replace('[',\"['\")) if False else '')" 2>/dev/null; fi; }

# ── 1. Reachability ──────────────────────────────────────────────────────────
hdr "1. Reachability"
HTML="$(curl -sS --max-time 20 "$TARGET/" 2>/dev/null)"
CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$TARGET/" 2>/dev/null)"
if [[ "$CODE" == "200" ]]; then c_pass "homepage 200" "$TARGET"; else c_fail "homepage 200" "got ${CODE:-no response}"; fi

BUNDLE="$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' <<<"$HTML" | head -1)"
if [[ -n "$BUNDLE" ]]; then c_pass "bundle referenced" "$BUNDLE"
else c_fail "bundle referenced" "no /assets/index-*.js in HTML"; fi

# ── 2. Build identity ───────────────────────────────────────────────────────
# The fix moves the PNG export into a pinned toolbar cluster; that marker only
# exists in the fixed bundle, so it identifies which build is actually served.
hdr "2. Build identity (is this the fixed build?)"
if [[ -n "$BUNDLE" ]]; then
  JS="$(curl -sS --max-time 40 "$TARGET$BUNDLE" 2>/dev/null)"
  if grep -q 'toolbar-right' <<<"$JS"; then
    c_pass "fixed toolbar build" "bundle contains toolbar-right"
  else
    c_fail "fixed toolbar build" "bundle is PRE-FIX (no toolbar-right) — fixes not deployed"
  fi
  # The deployed commit hash lives in the lazily-loaded Settings chunk.
  # Chunk references are relative ("assets/SettingsModal-*.js"), not root-absolute.
  SETTINGS="$(grep -oE 'assets/SettingsModal-[A-Za-z0-9_-]+\.js' <<<"$JS" | head -1)"
  if [[ -n "$SETTINGS" ]]; then
    SJS="$(curl -sS --max-time 40 "$TARGET/${SETTINGS}" 2>/dev/null)"
    SHA="$(grep -oE 'Git commit hash`?,?children:`?[^`]*`' <<<"$SJS" | grep -oE '`[^`]*`$' | tr -d '`' | head -1)"
    VER="$(grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' <<<"$SJS" | head -1)"
    [[ -n "$VER" ]] && c_pass "app version" "$VER"
    if [[ -z "$SHA" ]]; then c_warn "deployed commit" "not found in Settings chunk"
    elif [[ "$SHA" == "unknown" ]]; then c_warn "deployed commit" "unknown — build has no .git (see docs §5)"
    elif [[ "$SHA" =~ ^b[0-9]{8}$ ]]; then c_pass "deployed build stamp" "$SHA (enable Coolify Source commit availability for git SHA)"
    else c_pass "deployed commit" "$SHA"; fi
  else
    c_warn "deployed commit" "Settings chunk not referenced"
  fi
fi

# ── 3. Security headers ─────────────────────────────────────────────────────
hdr "3. Security headers"
HDRS="$(curl -sSI --max-time 20 "$TARGET/" 2>/dev/null)"
check_hdr() {
  local name="$1" needle="$2"
  if grep -qi "^${name}:" <<<"$HDRS"; then c_pass "$name" "$(grep -i "^${name}:" <<<"$HDRS" | cut -d' ' -f2- | cut -c1-46)"
  else c_fail "$name" "missing"; fi
}
check_hdr "Content-Security-Policy" "default-src"
check_hdr "X-Content-Type-Options" "nosniff"
check_hdr "Referrer-Policy" "strict-origin"
check_hdr "X-Frame-Options" "DENY"
# HSTS is rolled out in stages (docs §3 step 4), so its absence on a local or
# freshly-deployed target is a warning, not a release blocker.
if grep -qi '^Strict-Transport-Security:' <<<"$HDRS"; then
  c_pass "Strict-Transport-Security" "$(grep -i '^Strict-Transport-Security:' <<<"$HDRS" | cut -d' ' -f2- | cut -c1-46)"
else
  c_warn "Strict-Transport-Security" "absent — add after the staged rollout"
fi
if grep -qi '^Permissions-Policy:' <<<"$HDRS"; then c_pass "Permissions-Policy" present
else c_warn "Permissions-Policy" "missing (not release-blocking)"; fi

# ── 4. Cache policy ─────────────────────────────────────────────────────────
hdr "4. Cache policy"
HTML_CC="$(grep -i '^cache-control:' <<<"$HDRS" | head -1 | cut -d' ' -f2-)"
if [[ -z "$HTML_CC" ]]; then
  c_fail "HTML Cache-Control" "absent — no directive at all"
elif grep -qiE 'no-(cache|store)' <<<"$HTML_CC"; then
  c_pass "HTML Cache-Control" "$HTML_CC"
else
  c_fail "HTML Cache-Control" "present but not no-cache: $HTML_CC"
fi
if [[ -n "$BUNDLE" ]]; then
  AS_CC="$(curl -sSI --max-time 20 "$TARGET$BUNDLE" 2>/dev/null | grep -i '^cache-control:' | head -1 | cut -d' ' -f2-)"
  if grep -qi 'immutable' <<<"$AS_CC"; then c_pass "hashed asset cache" "$AS_CC"
  elif [[ -n "$AS_CC" ]]; then c_fail "hashed asset cache" "not immutable: $AS_CC"
  else c_fail "hashed asset cache" "absent"; fi
fi

# ── 5. Release-blocking defect probes ───────────────────────────────────────
hdr "5. Live defect probes (needs Playwright + Chromium)"

if [[ $SKIP_BROWSER -eq 1 ]]; then
  c_warn "UI-02/03/04/07 probes" "skipped (--no-browser)"
elif ! command -v npx >/dev/null 2>&1; then
  c_warn "UI probes" "npx unavailable"
else
  if [[ ! -d node_modules/@playwright/test ]]; then
    c_warn "UI probes" "run npm ci first"
  else
    PROBE="$OUT_DIR/probe-$STAMP.mjs"
    cat > "$PROBE" <<'PROBE_JS'
import { chromium } from '@playwright/test'
const base = process.env.PROBE_TARGET
const b = await chromium.launch()
const out = { probes: [] }
const rec = (id, ok, detail) => out.probes.push({ id, ok, detail })

try {
  // UI-02 — add-format popover must fit a 393px viewport.
  {
    const ctx = await b.newContext({ viewport: { width: 393, height: 852 } })
    const p = await ctx.newPage()
    await p.goto(base, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.konvajs-content', { timeout: 30000 })
    await p.getByRole('button', { name: 'Add a canvas format' }).click()
    await p.waitForTimeout(500)
    const g = await p.evaluate(() => {
      const m = [...document.querySelectorAll('div')].find(e => /absolute left-0 top-full z-50 mt-1/.test(String(e.className)))
      if (!m) return null
      const r = m.getBoundingClientRect()
      return { overflowPx: Math.round(r.right - innerWidth), visibleRatio: +(((Math.min(r.right, innerWidth) - Math.max(r.left, 0)) / r.width) * 100).toFixed(1) }
    })
    if (!g) rec('UI-02', false, 'menu not found')
    else rec('UI-02', g.overflowPx <= 0, `overflowPx=${g.overflowPx} visible=${g.visibleRatio}%`)
    await ctx.close()
  }

  // UI-07 — PNG export must sit inside the 393px viewport.
  {
    const ctx = await b.newContext({ viewport: { width: 393, height: 852 } })
    const p = await ctx.newPage()
    await p.goto(base, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.konvajs-content', { timeout: 30000 })
    const g = await p.evaluate(() => {
      const btn = document.querySelector('button[title="Export the active canvas at its original size"]')
      if (!btn) return null
      const r = btn.getBoundingClientRect()
      return { clippedPx: Math.max(0, Math.round(r.right - innerWidth)), scrollW: document.documentElement.scrollWidth }
    })
    if (!g) rec('UI-07', false, 'export button not found')
    else rec('UI-07', g.clippedPx === 0 && g.scrollW === 393, `clippedPx=${g.clippedPx} docScrollW=${g.scrollW}`)
    await ctx.close()
  }

  // UI-03 — header controls must be on screen at 1440px.
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(base, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.konvajs-content', { timeout: 30000 })
    const g = await p.evaluate(() => {
      const right = document.querySelector('[data-testid="toolbar-right"]')
      if (!right) return null
      const r = right.getBoundingClientRect()
      return { overflowPx: Math.max(0, Math.round(r.right - innerWidth)) }
    })
    if (!g) rec('UI-03 header', false, 'pinned right cluster absent (PRE-FIX build)')
    else rec('UI-03 header', g.overflowPx <= 1, `overflowPx=${g.overflowPx}`)
    await ctx.close()
  }

  // UI-04 — focus must stay inside Templates and Projects dialogs.
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(base, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.konvajs-content', { timeout: 30000 })
    for (const name of [/Templates/, /Projects/]) {
      const opener = p.getByRole('button', { name }).first()
      await opener.focus()
      await p.keyboard.press('Enter')
      await p.waitForTimeout(900)
      let escaped = 0
      for (let i = 0; i < 6; i++) {
        await p.keyboard.press('Tab')
        await p.waitForTimeout(60)
        const inside = await p.evaluate(() => {
          const d = document.querySelector('[role=dialog]')
          return d ? d.contains(document.activeElement) : false
        })
        if (!inside) escaped++
      }
      rec(`UI-04 ${String(name).replace(/[\/\\^$]/g, '')}`, escaped === 0, `tab escapes=${escaped}/6`)
      await p.keyboard.press('Escape')
      await p.waitForTimeout(400)
    }
    await ctx.close()
  }

  // UI-01 — canvas stays visible at 393px.
  {
    const ctx = await b.newContext({ viewport: { width: 393, height: 852 } })
    const p = await ctx.newPage()
    await p.goto(base, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.konvajs-content', { timeout: 30000 })
    const g = await p.evaluate(() => {
      const c = document.querySelector('.konvajs-content').getBoundingClientRect()
      return { w: Math.round(c.width), visible: Math.round(Math.min(c.right, innerWidth) - Math.max(c.left, 0)) }
    })
    rec('UI-01 canvas visible', g.w > 0 && g.visible === g.w, `cssW=${g.w} visibleW=${g.visible}`)
    await ctx.close()
  }
} catch (error) {
  out.error = String(error && error.message ? error.message : error).slice(0, 300)
} finally {
  await b.close()
}
console.log(JSON.stringify(out))
PROBE_JS

    RESULT="$(PROBE_TARGET="$TARGET" node "$PROBE" 2>/dev/null | tail -1)"
    rm -f "$PROBE"
    if [[ -z "$RESULT" ]]; then
      c_warn "UI probes" "probe produced no output"
    else
      while IFS=$'\t' read -r id ok detail; do
        [[ -z "$id" ]] && continue
        if [[ "$ok" == "true" ]]; then c_pass "$id" "$detail"; else c_fail "$id" "$detail"; fi
      done < <(printf '%s' "$RESULT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('error'): print('probe\tfalse\t'+d['error'][:120])
for p in d.get('probes',[]): print(f\"{p['id']}\t{str(p['ok']).lower()}\t{p['detail']}\")
" 2>/dev/null)
    fi
  fi
fi

# ── 6. Full live suites (optional, slow) ────────────────────────────────────
# This script is a strict release readiness gate, not a pre-deployment smoke:
# explicitly include post-rollout UI acceptance and the enforced CSP tests.
# The latter intentionally fails until Coolify/Cloudflare headers are live.
hdr "6. Full live suites"
if [[ $SKIP_BROWSER -eq 1 ]]; then
  c_warn "acceptance + csp specs" "skipped (--no-browser)"
else
  if MOKLU_LIVE_ACCEPTANCE=1 MOKLU_REQUIRE_CSP=1 MOKLU_DEPLOY_URL="$TARGET" npx playwright test tests/live/acceptance.spec.mjs tests/live/csp.spec.mjs \
      --config=tests/live/playwright.config.mjs --project=chromium-desktop --reporter=line >"$OUT_DIR/specs-$STAMP.log" 2>&1; then
    SUMMARY="$(grep -oE '[0-9]+ passed[^)]*' "$OUT_DIR/specs-$STAMP.log" | tail -1)"
    c_pass "acceptance + csp specs" "${SUMMARY:-passed}"
  else
    c_fail "acceptance + csp specs" "see $OUT_DIR/specs-$STAMP.log"
  fi
fi

# ── Summary ────────────────────────────────────────────────────────────────
TOTAL=$((PASS+FAIL+WARN))
echo
printf '──── %d checks: ' "$TOTAL"
printf '\033[32m%d pass\033[0m  ' "$PASS"
printf '\033[31m%d fail\033[0m  ' "$FAIL"
printf '\033[33m%d warn\033[0m\n' "$WARN"

{
  echo "Moklu deploy verification"
  echo "target: $TARGET"
  echo "when  : $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  printf '%-5s %-34s %s\n' STATUS CHECK DETAIL
  for row in "${ROWS[@]}"; do printf '%-5s %-34s %s\n' "${row%%|*}" "$(cut -d'|' -f2 <<<"$row")" "$(cut -d'|' -f3 <<<"$row")"; done
  echo
  echo "pass=$PASS fail=$FAIL warn=$WARN"
} > "$REPORT"
echo "report written: $REPORT"

if [[ $FAIL -gt 0 ]]; then
  echo
  echo "VERDICT: FAIL — $FAIL blocking check(s). If 'fixed toolbar build' failed, the fixes are not deployed."
  exit 1
fi
echo
echo "VERDICT: PASS"
