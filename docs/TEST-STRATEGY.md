# Test Strategy — Conduit QA Portfolio

## 1. Application Under Test

I chose Conduit because it has a real end-to-end user flow (auth, CRUD, comments, favorites) and a documented REST API — which lets me demonstrate a multi-layer test strategy in one project. At BraveBits I tested PageFly and OneTick, both of which involved testing UI behavior alongside API calls in the same flow. Conduit has a similar structure: actions on the UI trigger API calls underneath, so the same approach applies — use the API to set up state, then test the UI behavior on top of it.

---

## 2. Test Pyramid Approach

```
         ┌─────────────────────┐
         │   Smoke — 6 tests   │  Critical path only. Runs on every PR.
         └─────────────────────┘  If these fail, nothing else matters.
        ┌───────────────────────────┐
        │  Regression — 11 tests   │  Full feature coverage. Runs nightly.
        └───────────────────────────┘  Uses API seeding to isolate UI behavior.
       ┌─────────────────────────────────┐
       │   API Contract — 11 tests      │  No browser. Validates API responses,
       └─────────────────────────────────┘  schemas, and error handling.
```

**Why this distribution:**

I deliberately kept the smoke suite small (6 tests, ~3 minutes). A smoke suite that takes 15 minutes stops being useful as a PR gate — developers stop waiting for it or start skipping it. Speed is a feature of a smoke suite.

Regression tests are heavier and run nightly. They use the API seeding pattern to set up data programmatically — this keeps each test focused on one behavior rather than re-testing the login and article creation flow in every test.

API contract tests run without a browser. They are the fastest and most stable layer — they catch breaking API changes before the UI tests even run.

---

## 3. What I Chose to Automate & Why

| Feature                                    | Layer         | Reason                                                                                      |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| Login / Register                           | Smoke UI      | Entry point of the entire app. If auth is broken, no other test can run.                    |
| Create article → appears in feed           | Smoke UI      | Core business value. A user who cannot publish is a broken product.                         |
| Published article accessible without login | Smoke UI      | Public-facing content — SEO and sharing depend on this.                                     |
| Post and delete comment                    | Regression UI | Interaction flow with clear success/failure state. API seeds the article.                   |
| Tag-based feed filtering                   | Regression UI | Discovery feature — subtle bugs here are easy to miss in manual testing.                    |
| Follow / Unfollow                          | Regression UI | State change that affects two users — tests both directions.                                |
| Favorite / Unfavorite                      | Regression UI | Counter update — prone to off-by-one regressions after refactors.                           |
| POST /articles schema                      | API Contract  | Ensures response structure doesn't silently change between deploys.                         |
| Auth error responses (401, 422)            | API Contract  | Negative paths are often undertested. Wrong status codes break client error handling.       |
| Bearer vs Token auth scheme                | API Contract  | Conduit uses a non-standard `Token` scheme. Documents a known client misconfiguration risk. |
| DELETE → subsequent GET is 404             | API Contract  | Catches soft-delete bugs where data appears deleted but is still retrievable.               |

---

## 4. What I Chose NOT to Automate & Why

| Area                           | Reason                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual / layout testing        | Requires dedicated tooling (Percy, Applitools). Out of scope for functional automation.                                                                         |
| Pagination                     | Data on the shared demo server is not stable enough for reliable pagination assertions.                                                                         |
| Performance testing            | Needs a separate tool (k6, Lighthouse). Not the purpose of this suite.                                                                                          |
| Real-time / WebSocket behavior | Conduit does not implement real-time features — not applicable.                                                                                                 |
| Full cross-browser coverage    | CI runs Chromium only. For a shared demo app, cross-browser coverage adds noise without meaningful signal. A production suite would include Firefox and Safari. |

---

## 5. API Seeding Pattern

Most regression tests need an article to exist before they can test anything meaningful. The naive approach is to create the article through the UI — but that adds 10–15 seconds of login and form-filling to every test, and it means a single UI bug in the editor breaks all your comment and feed tests.

Instead, I use the API to seed data before the test starts:

```typescript
// beforeEach — set up state via API, not UI
const token = await apiUtils.login(email, password);
const article = await apiUtils.createArticle(token, articleData);

// The actual test — focused entirely on the behavior under test
await page.goto(`/article/${article.slug}`);
await articlePage.postComment('Great article');
await expect(articlePage.getComment('Great article')).toBeVisible();
```

This pattern isolates each test to one responsibility. If the comment test fails, I know the comment feature is broken — not the login or article creation flow.

Cleanup runs in `afterEach` using the same API, so tests don't leave data behind on the shared server.

---

## 6. Known Limitations

These are intentional trade-offs, not oversights.

**Shared demo server**
All test runs share the same Conduit instance with other users. Global feed content is non-deterministic. I mitigated this by creating test-specific articles with `Date.now()` suffixes and cleaning up in `afterEach`.

**Token expiry**
Conduit tokens expire quickly with no refresh mechanism. I call `apiUtils.login()` in every `beforeEach` and `afterEach` rather than reusing a session-level token. This adds ~200ms per test but eliminates an entire class of intermittent 401 failures.

**Angular SPA auth state**
Full page reloads re-call `GET /api/user` which fails if the token was invalidated. I discovered this during smoke test development — the editor test was failing when navigating via URL instead of the in-app link. Fix: always use SPA navigation (`feedPage.clickNewArticle()`) rather than `page.goto('/editor')` when already authenticated.

**Unauthenticated article access**
During testing I discovered that articles published by the test account (`hongngo123`) return 404 for unauthenticated users on this demo server — likely a server-side quirk. The smoke test for public article access now uses an article from the global feed rather than one created by the test account.

**workers: 1**
The demo server invalidates a user's token when the same account logs in from a second concurrent session. Parallel workers with the same credentials would cause constant auth failures. I set `workers: 1` globally. In a production environment with a dedicated test account per worker, this restriction would be removed.

**Lessons from working on a shared demo vs a real product**
At BraveBits I always had a dedicated staging environment — data was controlled, isolated, and reset between test runs. Working against a shared public demo for this portfolio made me appreciate that setup a lot more. Several test decisions in this project (workers: 1, Date.now() suffixes on article titles, always-cleanup in afterEach) exist purely because of the shared environment constraint. In a real product setup, most of these workarounds would be unnecessary.

---

## 7. CI/CD Strategy

**Smoke on PR** — every pull request into `main` triggers the 6 smoke tests on Chromium. Target runtime is under 5 minutes. Concurrency is keyed on PR number so a new push cancels the previous run for the same PR.

**Regression nightly** — runs at 23:00 Vietnam time (16:00 UTC) against the live demo. Also supports `workflow_dispatch` with a suite selector (smoke / regression / api / all) for manual runs. HTML reports are uploaded as artifacts and retained for 7 days.

I chose nightly over post-merge for regression because the shared demo server makes regression tests inherently slower and occasionally flaky. Running them as a PR gate would create too much noise on the main branch.

---

## 8. What I Would Do Differently in Production

**Dedicated test environment**
The single biggest limitation of this portfolio is the shared demo server. In production I would push for a dedicated staging environment seeded with controlled data — this removes flakiness caused by other users and enables parallel execution.

**Parallel execution**
With isolated test accounts (one per worker), all 28 tests could run in parallel and complete in under 2 minutes. Currently they run serially due to the shared-account constraint.

**Visual regression layer**
I would add Percy or Applitools for a small set of key pages (feed, article, editor). Functional tests don't catch layout regressions.

**Contract testing with schema validation**
The current API tests do manual schema checks with `toMatchObject`. In a production API with many endpoints I would introduce a formal schema validation library (zod, ajv) and generate tests from the OpenAPI spec.

**Test data management**
On a real app I would use a factory pattern for test data rather than a static `testdata.json`, with a teardown hook that deletes everything created under a `[TEST]` prefix.

**Involve QA earlier in the feature cycle**
At BraveBits I learned that the most valuable thing a QA can do is not write more tests — it's catch ambiguous requirements before development starts. A lot of bugs I found in PageFly could have been avoided with a 15-minute review of the spec before any code was written. I would apply the same approach here: test strategy defined before implementation, not after.

**Balance between automation and exploratory testing**
Not everything should be automated. During my time testing PageFly and OneTick, some of the most critical bugs were found through exploratory testing — following a hunch, trying an unexpected user flow, or testing on a device we hadn't considered. Automation covers the known paths; exploratory testing finds the unknown ones. This portfolio covers the automation side, but I treat both as equally important in practice.
