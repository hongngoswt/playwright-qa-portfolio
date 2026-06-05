# Playwright QA Portfolio

![Smoke Tests](https://github.com/hongngoswt/playwright-qa-portfolio/actions/workflows/smoke-on-pr.yml/badge.svg)

A production-grade test automation portfolio demonstrating senior QA engineering skills: Page Object Model, API seeding, contract testing, and CI/CD integration — all against [Conduit](https://demo.realworld.show), the RealWorld reference app.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev) v1.60+ | Browser automation and API testing |
| TypeScript | Type-safe test code |
| GitHub Actions | CI/CD — PR gate + nightly schedule |
| [Conduit (RealWorld)](https://demo.realworld.show) | App under test (UI + REST API) |

---

## Test Structure

| Suite | Tag | Count | Runs |
|-------|-----|-------|------|
| Smoke | `@smoke` | 6–8 | Every PR (blocks merge) |
| Regression | `@regression` | ~15 | Nightly at 23:00 Vietnam time |
| API Contract | `@api` | ~10 | Nightly |

---

## Quick Start

```bash
git clone https://github.com/hongngoswt/playwright-qa-portfolio.git
cd playwright-qa-portfolio
npm install
npx playwright install chromium
npm run test:smoke
```

---

## Available Commands

| Command | What it runs |
|---------|-------------|
| `npm run test:smoke` | `@smoke` suite — critical path only |
| `npm run test:regression` | `@regression` suite — full coverage |
| `npm run test:api` | `@api` suite — API contract tests, no browser |
| `npm run test:headed` | All tests with visible browser window |
| `npm test` | All tests |
| `npm run report` | Open the last HTML report |

---

## Test Strategy

See [docs/TEST-STRATEGY.md](docs/TEST-STRATEGY.md) for the full test strategy document, including risk areas, coverage decisions, and out-of-scope items.

---

## What This Demonstrates

- **Page Object Model** — all selectors and interactions encapsulated in `conduit/pages/`; test files contain only orchestration and assertions
- **API Seeding Pattern** — regression tests use `ApiUtils` to seed data via REST before navigating the UI, eliminating fragile UI setup chains
- **API Contract Testing** — `@api` tests verify status codes, response schema, and auth header behaviour directly against the REST API with no browser
- **Tag Strategy** — `@smoke` / `@regression` / `@api` enable selective execution in CI with a single `--grep` flag
- **CI/CD** — `smoke-on-pr.yml` gates every PR; `regression-nightly.yml` runs the full suite on a cron schedule with manual override via `workflow_dispatch`
