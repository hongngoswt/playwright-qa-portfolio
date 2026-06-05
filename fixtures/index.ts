import { test as base, expect } from '@playwright/test';
import { ApiUtils } from '../conduit/utils/ApiUtils';
import testdata from '../data/testdata.json';

interface AuthenticatedFixtures {
  authenticatedPage: { token: string };
  apiUtils: ApiUtils;
}

export const test = base.extend<AuthenticatedFixtures>({
  apiUtils: async ({ request }, use) => {
    await use(new ApiUtils(request));
  },

  authenticatedPage: async ({ page, request }, use) => {
    const apiUtils = new ApiUtils(request);
    const { email, password } = testdata.users.default;
    const token = await apiUtils.login(email, password);

    // addInitScript runs before Angular bootstraps on every navigation — more reliable than
    // evaluate+reload because it sets localStorage before the app's JS executes
    await page.addInitScript((t) => localStorage.setItem('jwtToken', t), token);
    await page.goto('/');
    // Wait for Angular to call GET /api/user and render the username in the nav bar
    await expect(
      page.getByRole('navigation').getByRole('link', { name: testdata.users.default.username })
    ).toBeVisible({ timeout: 15000 });

    await use({ token });
  },
});

export { expect };
