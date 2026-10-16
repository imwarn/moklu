import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { decodeValidatedPng } from './png-output.mjs'

const golden = readFileSync(new URL('../tests/goldens/konva-rect-240x240.png', import.meta.url))
const asDataUrl = 'data:image/png;base64,' + golden.toString('base64')

describe('CLI PNG output', () => {
  it('decodes a real versioned transparent PNG only at the exact dimensions', () => {
    expect(decodeValidatedPng(asDataUrl, 240, 240).equals(golden)).toBe(true)
    expect(() => decodeValidatedPng(asDataUrl, 239, 240)).toThrow(/dimensions mismatch/)
    expect(() => decodeValidatedPng(asDataUrl, 240, 241)).toThrow(/dimensions mismatch/)
  })
  it('rejects malformed output, bad MIME type, and absent dimension metadata', () => {
    expect(() => decodeValidatedPng('data:image/png;base64,AAAA', 240, 240)).toThrow(/signature|IHDR/)
    expect(() => decodeValidatedPng('data:text/html;base64,AAAA', 240, 240)).toThrow(/not a PNG/)
    expect(() => decodeValidatedPng(asDataUrl, undefined, 240)).toThrow(/expected dimensions/)
  })
})
