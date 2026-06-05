import { test, expect } from '../../../fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { FeedPage } from '../../pages/FeedPage';
import testdata from '../../../data/testdata.json';

test.describe('Authentication', () => {
  test('@smoke valid login redirects to feed with username visible in nav', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testdata.users.default.email, testdata.users.default.password);

    const feedPage = new FeedPage(page);
    await feedPage.assertUsernameInNav(testdata.users.default.username);
  });

  test('@smoke wrong password shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.attemptLogin(testdata.users.default.email, 'wrongpassword');

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toBeTruthy();
  });

  test('@smoke empty email — sign in button is disabled', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Angular reactive form disables submit when email is empty (client-side validation);
    // no server round-trip occurs — the button being disabled IS the feedback to the user
    await loginPage.assertSignInButtonDisabled();
  });

  test('@smoke register new user redirects to feed', async ({ page }) => {
    const email = `test_${Date.now()}@test.com`;
    const username = `user${Date.now()}`;
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(username, email, testdata.users.default.password);

    const feedPage = new FeedPage(page);
    await feedPage.assertUsernameInNav(username);
  });
});
