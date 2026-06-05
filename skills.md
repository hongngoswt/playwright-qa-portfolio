# Playwright QA Portfolio — Reference Guide

Quick-reference for working in this codebase. Covers project layout, coding standards, patterns, and common mistakes.

---

## Project

Playwright + TypeScript automation portfolio for Senior QA Engineer role.
Testing Conduit (RealWorld app) — UI + API layers.

- Frontend: https://demo.realworld.show
- API Base: https://api.realworld.show/api
- Test account: hongngo123@test.com / Test@1234

---

## Folder Structure

```
conduit/
  pages/          ← Page Object Model (LoginPage, ArticlePage, EditorPage, FeedPage, ProfilePage)
  tests/
    smoke/        ← @smoke tag, critical path, runs on every PR
    regression/   ← @regression tag, full suite, runs nightly
    api/          ← @api tag, no browser, API contract tests
  utils/
    ApiUtils.ts   ← login(), createArticle(), deleteArticle(), createComment(), followUser()
fixtures/
  index.ts        ← authenticatedPage fixture (API login → localStorage inject)
data/
  testdata.json   ← test credentials and seed data
docs/
  TEST-STRATEGY.md
.github/workflows/
  smoke-on-pr.yml        ← triggers on PR to main, runs @smoke, 15 min timeout
  regression-nightly.yml ← cron 16:00 UTC + manual dispatch, 30 min timeout
```

---

## Auth Header — Critical Detail

```
Authorization: Token <token>   ← CORRECT (Conduit-specific scheme)
Authorization: Bearer <token>  ← WRONG (OAuth2 scheme — API returns 401)
```

Token format: opaque string like `token_xxxxx`. Expires quickly — always fetch a fresh token in `afterEach` cleanup rather than reusing the one from the test body.

---

## Selectors (priority order — applies to Page Objects only)

1. `getByRole()` — preferred for accessibility alignment
2. `getByLabel()` — for form inputs
3. `getByTestId()` — when role/label are unavailable
4. CSS locators (`.classname`, `locator()`) — allowed **inside Page Objects only**, never in test files
5. **NEVER** use CSS selectors or XPath directly in test files

---

## Waits

```typescript
// NEVER
await page.waitForTimeout(2000);

// ALWAYS use assertion-based or URL-based waits
await expect(element).toBeVisible();
await page.waitForURL('/expected-path');
```

---

## Page Object Rules

- All selectors live in `conduit/pages/` — never in test files
- Every public method returns `Promise<void>` or a typed value
- Constructor takes `page: Page`
- Methods that assert state (e.g. `assertCommentBoxHidden`) do so via `expect()` inside the page object

---

## Test Tags — every test must have one

| Tag | Suite | Count | Runs |
|-----|-------|-------|------|
| `@smoke` | Critical path | 6–8 | Every PR |
| `@regression` | Full coverage | ~15 | Nightly |
| `@api` | API contracts, no browser | ~10 | Nightly |

---

## API Seeding Pattern (regression tests)

```typescript
// CORRECT: seed via API, test UI behaviour
const token = await apiUtils.login(email, password);
const article = await apiUtils.createArticle(token, articleData);
await page.goto(`/article/${article.slug}`);
// now assert UI behaviour

// WRONG: logging in through the UI just to create test data
await loginPage.goto();
await loginPage.login(email, password);
await editorPage.goto();
await editorPage.fillArticle(...);
```

---

## Fixtures

| Fixture | What it provides |
|---------|-----------------|
| `authenticatedPage` | `{ token }` — page is pre-authenticated via API + localStorage injection |
| `apiUtils` | `ApiUtils` instance bound to the test's `request` context |

Import in test files:

```typescript
import { test, expect } from '../../../fixtures';
```

Use `page` (not `authenticatedPage`) when the test explicitly needs an unauthenticated browser context.

---

## Cleanup Pattern

```typescript
let createdSlug: string | undefined;

test.afterEach(async ({ request }) => {
  if (createdSlug) {
    const apiUtils = new ApiUtils(request);
    const token = await apiUtils.login(email, password);  // fresh token — they expire quickly
    await apiUtils.deleteArticle(token, createdSlug);
    createdSlug = undefined;
  }
});
```

Always get a fresh token in `afterEach` — don't rely on the token captured during the test body.

---

## ApiUtils Reference

```typescript
const apiUtils = new ApiUtils(request);

apiUtils.login(email, password)                          → Promise<string>  (token)
apiUtils.createArticle(token, { title, description, body, tagList? })  → Promise<Article>
apiUtils.deleteArticle(token, slug)                      → Promise<void>
apiUtils.createComment(token, slug, body)                → Promise<Comment>
apiUtils.deleteComment(token, slug, commentId)           → Promise<void>
apiUtils.getArticles(limit?)                             → Promise<Article[]>
apiUtils.followUser(token, username)                     → Promise<void>
apiUtils.unfollowUser(token, username)                   → Promise<void>
```

---

## Test File Template

```typescript
import { test, expect } from '../../../fixtures';

test.describe('Feature Name', () => {
  test('@smoke description of what this tests', async ({ page }) => {
    // arrange → act → assert
  });
});
```

---

## CI/CD

| Workflow | Trigger | Timeout | Grep |
|----------|---------|---------|------|
| `smoke-on-pr.yml` | PR to main (cancels in-progress on same PR) | 15 min | `@smoke` |
| `regression-nightly.yml` | Cron 16:00 UTC + `workflow_dispatch` | 30 min | selectable: smoke / regression / api / all |

Both workflows: `ubuntu-latest`, `CI=true`, Chromium only, HTML report artifact (7-day retention).

---

## Common Mistakes to Avoid

### 1. Using `waitForTimeout()` instead of assertion-based waits

```typescript
// WRONG — arbitrary sleep, fails under load or on slow CI
await page.waitForTimeout(3000);
await page.getByRole('button', { name: 'Post Comment' }).click();

// CORRECT — Playwright retries until the element is interactive
await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible();
await page.getByRole('button', { name: 'Post Comment' }).click();
```

Why it matters: `waitForTimeout` creates timing-dependent flakiness. The `expect().toBeVisible()` pattern retries up to the configured timeout and passes as soon as the condition is true.

---

### 2. Writing selectors directly in test files

```typescript
// WRONG — selector in test file, breaks the POM contract
test('...', async ({ page }) => {
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Sign in' }).click();
});

// CORRECT — selector lives in LoginPage.ts, test calls a method
test('...', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(email, password);
});
```

Why it matters: selectors in test files spread duplication across the suite. When the UI changes, one Page Object update fixes every test that uses it.

---

### 3. Using Bearer instead of Token auth header

```typescript
// WRONG — Conduit uses its own "Token" scheme, not OAuth2 Bearer
headers: { Authorization: `Bearer ${token}` }  // → 401

// CORRECT
headers: { Authorization: `Token ${token}` }   // → 200/201
```

Why it matters: this is a silent misconfiguration — the request is well-formed HTTP, but the API rejects it. The API contract tests exist specifically to catch this at the boundary.

---

### 4. Skipping afterEach cleanup on the shared demo app

```typescript
// WRONG — article persists on the shared demo server, polluting other tests
test('@regression ...', async ({ page, authenticatedPage, request }) => {
  const article = await apiUtils.createArticle(token, data);
  await page.goto(`/article/${article.slug}`);
  // test ends, article is never deleted
});

// CORRECT
let createdSlug: string | undefined;
test.afterEach(async ({ request }) => {
  if (createdSlug) {
    const apiUtils = new ApiUtils(request);
    const token = await apiUtils.login(email, password);
    await apiUtils.deleteArticle(token, createdSlug);
    createdSlug = undefined;
  }
});
```

Why it matters: the Conduit demo is a shared environment. Leaked articles accumulate, slow down the global feed, and cause unrelated tests to find unexpected data.

---

### 5. Hardcoding credentials in test files instead of testdata.json

```typescript
// WRONG — credentials scattered across test files, hard to rotate
await loginPage.login('hongngo123@test.com', 'Test@1234');

// CORRECT — single source of truth in data/testdata.json
import testdata from '../../../data/testdata.json';
await loginPage.login(testdata.users.default.email, testdata.users.default.password);
```

Why it matters: when the test account password changes, a single edit to `testdata.json` fixes the entire suite. Hardcoded strings require a grep-and-replace across every test file.
