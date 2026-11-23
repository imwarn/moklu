/**
 * [INPUT]: depends on vitest, node fs/os/path, parseArgs from ./index.mjs, and startServer/closeServer from ./export.mjs
 * [OUTPUT]: unit tests covering CLI flag parsing with '=' values and static server error/close lifecycle
 * [POS]: unit test suite for cli/index.mjs and cli/export.mjs server management
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { parseArgs } from './index.mjs'
import { closeServer, startServer } from './export.mjs'

describe('CLI parseArgs', () => {
  it('preserves "=" characters inside option values', () => {
    const opts = parseArgs([
      '--project=/tmp/a=b/project=v1.json',
      '--screenshots=/tmp/dir=1/shots=raw',
      '--output=/tmp/out=2026/dir=en',
      '--locale=zh-Hans',
    ])

    expect(opts).toEqual({
      project: '/tmp/a=b/project=v1.json',
      screenshots: '/tmp/dir=1/shots=raw',
      output: '/tmp/out=2026/dir=en',
      locale: 'zh-Hans',
    })
  })

  it('handles boolean flags, empty values, and ignores non-flag arguments', () => {
    const opts = parseArgs([
      'positional',
      '-h',
      '--',
      '--=orphan',
      '--all-locales',
      '--empty=',
      '--port=4321',
    ])

    expect(opts).toEqual({
      'all-locales': 'true',
      empty: '',
      port: '4321',
    })
  })
})

describe('CLI static server lifecycle', () => {
  const tempDirs = []
  const servers = []

  afterEach(async () => {
    while (servers.length > 0) {
      const server = servers.pop()
      await closeServer(server)
    }
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop(), { recursive: true, force: true })
    }
  })

  it('rejects cleanly on EADDRINUSE and releases the port after closeServer resolves', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'moklu-cli-test-'))
    tempDirs.push(rootDir)
    writeFileSync(join(rootDir, 'index.html'), '<!doctype html><title>ok</title>')

    const first = await startServer(0, rootDir)
    servers.push(first)
    const address = first.address()
    const port = typeof address === 'object' && address ? address.port : 0
    expect(port).toBeGreaterThan(0)

    await expect(startServer(port, rootDir)).rejects.toMatchObject({ code: 'EADDRINUSE' })

    await closeServer(first)
    servers.pop()

    const rebound = await startServer(port, rootDir)
    servers.push(rebound)
    expect(rebound.listening).toBe(true)
  })
})
