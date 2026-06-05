import { test, expect } from '../../../fixtures';
import { ProfilePage } from '../../pages/ProfilePage';
import { ApiUtils } from '../../utils/ApiUtils';
import testdata from '../../../data/testdata.json';

test.describe('Profile', () => {
  let followTarget: string | undefined;
  let createdSlug: string | undefined;

  test.beforeEach(async ({ request }) => {
    // Discover a user to follow from global feed — avoids hardcoding usernames
    const apiUtils = new ApiUtils(request);
    const articles = await apiUtils.getArticles(10);
    const otherAuthor = articles.find(
      (a) => a.author.username !== testdata.users.default.username,
    );
    if (!otherAuthor) throw new Error('No follow target found in global feed');
    followTarget = otherAuthor.author.username;
  });

  test.afterEach(async ({ request }) => {
    const apiUtils = new ApiUtils(request);
    const token = await apiUtils.login(
      testdata.users.default.email,
      testdata.users.default.password,
    );
    if (followTarget) {
      await apiUtils.unfollowUser(token, followTarget);
      followTarget = undefined;
    }
    if (createdSlug) {
      await apiUtils.deleteArticle(token, createdSlug);
      createdSlug = undefined;
    }
  });

  test('@regression follow a user changes button to Unfollow', async ({ page, authenticatedPage }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto(followTarget!);
    await profilePage.followUser();
  });

  test('@regression unfollow a user changes button back to Follow', async ({ page, authenticatedPage, request }) => {
    // Pre-seed the follow state via API so the test starts already following
    const { token } = authenticatedPage;
    const apiUtils = new ApiUtils(request);
    await apiUtils.followUser(token, followTarget!);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(followTarget!);
    await profilePage.unfollowUser();
    // afterEach calls unfollowUser again — idempotent on already-unfollowed state
  });

  test('@regression profile page shows the user\'s published articles', async ({ page, authenticatedPage, request }) => {
    const { token } = authenticatedPage;
    const apiUtils = new ApiUtils(request);
    const title = `Profile Article ${Date.now()}`;
    const article = await apiUtils.createArticle(token, {
      title,
      description: testdata.articles.default.description,
      body: testdata.articles.default.body,
    });
    createdSlug = article.slug;

    const profilePage = new ProfilePage(page);
    await profilePage.goto(testdata.users.default.username);
    await profilePage.assertMyArticleVisible(title);
  });
});
