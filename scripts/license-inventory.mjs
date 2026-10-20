import { readFile, mkdir, writeFile } from 'node:fs/promises'
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
const dependencies = Object.entries(lock.packages ?? {})
  .filter(([location]) => location.startsWith('node_modules/'))
  .map(([location, entry]) => ({
    name: location.slice('node_modules/'.length),
    version: entry.version ?? 'unknown',
    license: entry.license ?? null,
    resolved: entry.resolved ?? null,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
const missing = dependencies.filter((dependency) => !dependency.license).map((dependency) => dependency.name)
const report = {
  generatedFrom: 'package-lock.json',
  packageCount: dependencies.length,
  missingLicenseMetadata: missing,
  packages: dependencies,
  caveat: 'Lockfile license fields are package metadata, not a legal assessment. Audit fonts, trademarks, SVG frames, templates and upstream notices separately.',
}
await mkdir('release-evidence', { recursive: true })
await writeFile('release-evidence/license-inventory.json', JSON.stringify(report, null, 2) + '\n')
console.log(`Recorded ${dependencies.length} dependency package entries; ${missing.length} have no license metadata.`)
