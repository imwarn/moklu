# .github/
> L2 | Parent: ../GEMINI.md

GitHub Actions CI, benchmark, deployment-smoke, live-reliability, and release-candidate workflows hardened for public-repository execution on ephemeral GitHub-hosted `ubuntu-latest` runners with least-privilege `contents: read` permissions, fork-PR guards, and sanitized runtime metadata.

## Member list
- `workflows/ci.yml`: Push and same-repo PR quality gate (lint, typecheck, CSP header verification, Vitest, SSG build) plus multi-browser Playwright E2E and local enforced-CSP smoke on `ubuntu-latest`.
- `workflows/live-reliability-gate.yml`: Same-repo PR reliability gate running normalization unit tests and Chromium live backup/pixel identity verification against `https://moklu.app` on `ubuntu-latest`.
- `workflows/benchmarks.yml`: Manual `main`-only Vitest microbenchmark suite on `ubuntu-latest` recording sanitized generic runtime metadata (`runner`, `os`, `arch`, `node`, `npm`) and uploading 30-day artifacts.
- `workflows/release-candidate.yml`: Manual `main`-only release-candidate verification pipeline (lint, typecheck, test, build, distributable verify, multi-browser preview E2E, `npm audit`, license inventory) on `ubuntu-latest` with sanitized runtime metadata.
- `workflows/deployment-smoke.yml`: Manual `main`-only post-deploy HTTPS/header check and multi-browser Playwright smoke suite against `https://moklu.app` on `ubuntu-latest`.

[PROTOCOL]: Update this header on change, then check GEMINI.md
