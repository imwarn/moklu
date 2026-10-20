# Moklu deployment and rollback runbook (v0.12 draft)

This document describes **static hosting**, not a certified production release.

## Build and candidate verification

Use Node 22 with a clean checkout and trusted packages:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
node scripts/verify-release.mjs
```

Run `Release Candidate Evidence` manually from the **main** branch. Download its build and audit artifacts. Review \`release-evidence/license-inventory.json\` alongside \`npm-audit.json\`; missing license fields are review items, not proof of infringement. Compare the commit SHA against the intended release and record the browser QA results, manual Safari/Edge evidence, license and asset authorization results before publishing any candidate. The workflow builds artifacts but **does not deploy** them or publish a release.

## Static deployment via Coolify / nginx

Serve `dist/` as immutable build output. Redirect HTTP to HTTPS, configure TLS, and provide SPA fallback for application paths. The root HTML should not be cached for a long time; hashed files under `/assets/` can use long-lived immutable caching.

Example nginx configuration snippet (adapt to your host):

```nginx
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
}
location / {
    add_header Cache-Control "no-cache, must-revalidate" always;
    try_files $uri $uri/ /index.html;
}
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "DENY" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

**CSP requires calibration before enforcement.** First deploy a `Content-Security-Policy-Report-Only` policy and inspect violations for fonts, image data/blob URLs, workers and any explicitly opted-in remote services. Do not blindly add `unsafe-inline`, `*` or arbitrary remote domains. Approve a narrowly-scoped policy after a browser QA pass on the exact release artifact. Platform TLS/HSTS settings need verification separately.

## Backups and restoration

Moklu stores user projects/assets locally in the browser. Backing up the server's `dist/` is **not a backup of client projects**. Before migration, browser data resets or storage changes, export the user's project JSON and verify it can be imported into an isolated browser profile, including all screenshot assets. Never claim a server rollback restores browser IndexedDB.

To roll back:
1. Freeze deployments and record failing SHA, reproduction steps and logs without users' screenshots.
2. Re-deploy the last approved immutable build artifact, restoring its security header configuration.
3. Test Quick Design, project import, canvas rendering and PNG export on a clean browser profile.
4. Validate previously saved user project files in an isolated profile; avoid destructive IndexedDB schema downgrades.

## Release blocking criteria

Do not mark the v1.0 checklist complete until the dependency audit findings have a reviewed disposition, licenses/materials are cleared, production security headers verified, benchmark outputs archived, the full browser matrix has passed and maintainers explicitly approve the candidate.

## RC versioning and changelog

Before publishing a candidate, choose the semver version and update the package manifest and lockfile together. Record user-visible changes and compatibility notes in CHANGELOG.md; avoid labeling internal iteration numbers (v0.10–v0.12) as already-published npm releases. Create an annotated RC tag from the exact successful SHA only after security, license, export and data-recovery gates pass. Keep the previous approved build artifact to support immediate rollback.
