/**
 * [INPUT]: depends on node:child_process (execFileSync); invokes local Wrangler CLI against remote D1 database moklu-funnel
 * [OUTPUT]: CLI reporter printing N-day conversion funnel by tool/event, top landing slugs, and rejected file formats from Cloudflare D1
 * [POS]: zero-secret operational funnel analytics query script inside scripts/
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { execFileSync } from 'node:child_process'

const DB_NAME = process.env.CF_FUNNEL_DB ?? 'moklu-funnel'
const CONFIG_PATH = 'workers/telemetry/wrangler.jsonc'
const DAYS = Math.max(1, Math.min(90, Number(process.argv[2] ?? '7') || 7))

function queryD1(sql) {
  const stdout = execFileSync(
    './node_modules/.bin/wrangler',
    ['d1', 'execute', DB_NAME, '--remote', '--json', '--config', CONFIG_PATH, '--command', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  const parsed = JSON.parse(stdout)
  return Array.isArray(parsed) ? (parsed[0]?.results ?? []) : []
}

const cutoffDate = new Date(Date.now() - DAYS * 86_400_000).toISOString().slice(0, 10)

const funnelByTool = queryD1(
  `SELECT tool, event, SUM(total) AS count FROM funnel_daily WHERE day >= '${cutoffDate}' GROUP BY tool, event ORDER BY tool ASC, count DESC LIMIT 60;`,
)

const topSlugs = queryD1(
  `SELECT slug, locale, event, SUM(total) AS count FROM funnel_daily WHERE day >= '${cutoffDate}' GROUP BY slug, locale, event ORDER BY count DESC LIMIT 30;`,
)

const rejectedFormats = queryD1(
  `SELECT ext, format AS mime, SUM(total) AS rejected_count FROM funnel_daily WHERE day >= '${cutoffDate}' AND event = 'format_rejected' GROUP BY ext, format ORDER BY rejected_count DESC LIMIT 20;`,
)

console.log(
  JSON.stringify(
    {
      database: DB_NAME,
      sinceDay: cutoffDate,
      windowDays: DAYS,
      funnelByTool,
      topSlugs,
      rejectedFormats,
    },
    null,
    2,
  ),
)
