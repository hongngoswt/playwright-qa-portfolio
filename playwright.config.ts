import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './conduit/tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry once on CI — account for flakiness on shared demo app */
  retries: process.env.CI ? 1 : 0,

  /* Single worker always — the demo app issues one session per user; concurrent logins
     with the same account invalidate each other's tokens. */
  workers: 1,

  /* HTML report + dot for CI logs */
  reporter: process.env.CI ? [['html'], ['dot']] : [['html']],

  use: {
    /* Conduit frontend */
    baseURL: 'https://demo.realworld.show',

    /* Collect trace on first retry — helps debug CI failures */
    trace: 'on-first-retry',

    /* Screenshot only on failure — keeps artifacts small */
    screenshot: 'only-on-failure',

    /* 30s timeout per action */
    actionTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
