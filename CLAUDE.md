# Playwright QA Portfolio — Claude Code Guide

## Project
Playwright + TypeScript automation portfolio for Senior QA Engineer role.
Testing Conduit (RealWorld app) — UI + API layers.

## Folder Structure
```
conduit/
  pages/          ← Page Object Model (LoginPage, ArticlePage, EditorPage, FeedPage)
  tests/
    smoke/        ← @smoke tag, critical path, runs on every PR
    regression/   ← @regression tag, full suite, runs nightly
    api/          ← @api tag, no browser, API contract tests
  utils/
    ApiUtils.ts   ← login(), createArticle(), deleteArticle(), createComment()
fixtures/
  index.ts        ← authenticatedPage fixture
data/
  testdata.json   ← test credentials and seed data
docs/
  TEST-STRATEGY.md
```

## Apps Under Test

### Conduit
- Frontend: https://demo.realworld.show
- API Base: https://api.realworld.show/api
- Auth header: `Authorization: Token <token>` — NOT Bearer, NOT JWT
- Token format: opaque string like `token_xxxxx`, expires quickly
- Test account: hongngo123@test.com / Test@1234

## Coding Standards — ALWAYS follow these

### Selectors (in priority order)
1. `getByRole()` — preferred
2. `getByLabel()`
3. `getByTestId()`
4. NEVER use CSS selectors or XPath in test files

### Waits
- NEVER use `page.waitForTimeout()` — always use `expect().toBeVisible()` or `waitForURL()`

### Page Objects
- All selectors live in Page Objects only — never in test files
- Every public method returns `Promise<void>` or a typed value
- Constructor takes `page: Page`

### Test Tags — every test must have one
- `@smoke` — critical path, ~6-8 tests total
- `@regression` — full coverage, ~15 tests total
- `@api` — API contract tests, no browser, ~10 tests total

### API Seeding Pattern (senior skill — use this in regression tests)
```typescript
// CORRECT: use API to setup data, then test UI behavior
const token = await apiUtils.login(email, password);
const article = await apiUtils.createArticle(token, articleData);
await page.goto(`/article/${article.slug}`);
// now test UI behavior
```

### Fixtures
- Use `fixtures/index.ts` for shared setup
- `authenticatedPage` fixture = page already logged in via API (not UI login)
- Import from `'../../../fixtures'` in test files

## Test File Template
```typescript
import { test, expect } from '../../../fixtures';

test.describe('Feature Name', () => {
  test('@smoke description of what this tests', async ({ page }) => {
    // arrange → act → assert
  });
});
```

## API Utils Usage
```typescript
import { ApiUtils } from '../../utils/ApiUtils';

const apiUtils = new ApiUtils(request);
const token = await apiUtils.login('hongngo123@test.com', 'Test@1234');
const article = await apiUtils.createArticle(token, { title, description, body, tagList });
await apiUtils.deleteArticle(token, article.slug); // cleanup in afterEach
```

## CI/CD
- `smoke-on-pr.yml` → triggers on PR to main, runs `--grep @smoke`
- `regression-nightly.yml` → runs at 16:00 UTC (11pm Vietnam) + manual trigger
- Only chromium browser for CI

## Commands
```bash
npm run test:smoke      # run @smoke tests
npm run test:regression # run @regression tests
npm run test:api        # run @api tests
npm run report          # open HTML report
```

## What NOT to do
- Don't create test files outside conduit/tests/ subfolders
- Don't hardcode credentials in test files — use data/testdata.json
- Don't skip cleanup — always delete articles/comments created in tests
- Don't use test.only without removing before commit
