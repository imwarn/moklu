#!/usr/bin/env node
/**
 * [INPUT]: depends on node fs/path/url and lazy-loaded command handlers from ./export.mjs and ./locale.mjs
 * [OUTPUT]: exports parseArgs and runs the Moklu/PixelDeck headless CLI commands (export, locale-manifest, locale-import)
 * [POS]: executable CLI entrypoint of cli/; parses --key=value flags without truncating '=' in values and dispatches subcommands
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { realpathSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

export function parseArgs(rawArgs) {
  const opts = {}
  for (const arg of rawArgs) {
    if (!arg.startsWith('--')) continue
    const body = arg.slice(2)
    if (!body) continue
    const eqIndex = body.indexOf('=')
    if (eqIndex === -1) {
      opts[body] = 'true'
    } else {
      const key = body.slice(0, eqIndex)
      if (!key) continue
      opts[key] = body.slice(eqIndex + 1)
    }
  }
  return opts
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  // --help / -h anywhere → print help and exit successfully
  if (args.includes('--help') || args.includes('-h') || !command) {
    printHelp()
    return
  }

  switch (command) {
    case 'export': {
      const opts = parseArgs(args.slice(1))
      const { runExport } = await import('./export.mjs')
      await runExport(opts)
      break
    }

    case 'locale-manifest': {
      const opts = parseArgs(args.slice(1))
      const { runLocaleManifest } = await import('./locale.mjs')
      await runLocaleManifest(opts)
      break
    }

    case 'locale-import': {
      const opts = parseArgs(args.slice(1))
      const { runLocaleImport } = await import('./locale.mjs')
      await runLocaleImport(opts)
      break
    }

    default:
      throw new Error(`Unknown command: ${command}. Run with --help to see available commands.`)
  }
}

function printHelp() {
  console.log(`
PixelDeck CLI

Commands:
  export          Export a project to PNG files
  locale-manifest Export a locale manifest JSON from a project
  locale-import   Import a locale manifest JSON into a project

Options for export:
  --project=<path>      Path to project JSON file
  --screenshots=<dir>   Directory containing screenshot PNG files
  --output=<dir>        Output directory for composed PNGs
  --locale=<code>       Export only this locale (e.g. --locale=es)
  --all-locales         Export all locales defined in the project
  --config=<path>       Batch config YAML (alternative to single project)
  --port=<n>            Port for the local server (default: 4321)
  --timeout=<ms>        Max wait for export (default: 60000)

Options for locale-manifest:
  --project=<path>      Path to project JSON file
  --output=<path>       Output path for manifest JSON (default: locale-manifest.json)

Options for locale-import:
  --project=<path>      Path to project JSON file
  --manifest=<path>     Path to locale manifest JSON to import
  --output=<path>       Output path for updated project JSON (default: overwrites --project)

Examples:
  node cli/index.mjs export --project=./project.json --output=./output
  node cli/index.mjs export --project=./project.json --output=./output --locale=es
  node cli/index.mjs export --project=./project.json --output=./output --all-locales
  node cli/index.mjs locale-manifest --project=./project.json --output=./locales.json
  node cli/index.mjs locale-import --project=./project.json --manifest=./locales.json
`)
}

function isDirectCliExecution() {
  const entryArg = process.argv[1]
  if (!entryArg) return false
  try {
    return realpathSync(resolve(entryArg)) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return resolve(entryArg) === fileURLToPath(import.meta.url)
  }
}

if (isDirectCliExecution()) {
  try {
    await main()
  } catch (error) {
    const verbose = process.argv.includes('--verbose') || Boolean(process.env.DEBUG)
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[PixelDeck CLI] ${verbose && error instanceof Error ? error.stack ?? message : message}`)
    process.exitCode = 1
  }
}
