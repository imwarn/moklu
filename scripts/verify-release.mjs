import { readFile, readdir, stat } from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'

const root = path.resolve('dist')
const index = await readFile(path.join(root, 'index.html'), 'utf8')
assert.match(index, /<html\b/i, 'Missing HTML root')
assert.match(index, /<script\b[^>]*type="module"/i, 'Missing application entry bundle')
const assets = await readdir(path.join(root, 'assets'))
assert.ok(assets.some((name) => name.endsWith('.js')), 'No JS build artifacts')
assert.ok(assets.some((name) => name.endsWith('.css')), 'No CSS build artifacts')
const entries = await Promise.all(assets.map(async (name) => ({ name, size: (await stat(path.join(root, 'assets', name))).size })))
assert.ok(entries.every((entry) => entry.size > 0), 'Empty build artifact')
console.log(JSON.stringify({ ok: true, assetCount: entries.length, totalAssetBytes: entries.reduce((n, x) => n + x.size, 0) }, null, 2))
