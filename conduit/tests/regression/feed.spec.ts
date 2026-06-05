import { test, expect } from '../../../fixtures';
import { FeedPage } from '../../pages/FeedPage';
import { ApiUtils } from '../../utils/ApiUtils';
import testdata from '../../../data/testdata.json';

test.describe('Feed', () => {
  let createdSlug: string | undefined;

  test.afterEach(async ({ request }) => {
    if (createdSlug) {
      const apiUtils = new ApiUtils(request);
      const token = await apiUtils.login(
        testdata.users.default.email,
        testdata.users.default.password,
      );
      await apiUtils.deleteArticle(token, createdSlug);
      createdSlug = undefined;
    }
  });

  test('@regression global feed loads and shows articles', async ({ page, authenticatedPage }) => {
    const feedPage = new FeedPage(page);
    await feedPage.goto();
    await feedPage.switchToGlobalFeed();
    await feedPage.assertHasArticles();
  });

  test('@regression article appears in tag feed after API seed', async ({ page, authenticatedPage, request }) => {
    const { token } = authenticatedPage;
    const uniqueTag = `tag-${Date.now()}`;
    const apiUtils = new ApiUtils(request);
    const article = await apiUtils.createArticle(token, {
      title: `Tag Feed Test ${Date.now()}`,
      description: testdata.articles.default.description,
      body: testdata.articles.default.body,
      tagList: [uniqueTag],
    });
    createdSlug = article.slug;

    const feedPage = new FeedPage(page);
    await feedPage.gotoTagFeed(uniqueTag);
    await feedPage.assertArticleVisible(article.title);
  });

  test('@regression switching feed tabs shows correct active tab', async ({ page, authenticatedPage }) => {
    const feedPage = new FeedPage(page);
    await feedPage.goto();

    await feedPage.switchToGlobalFeed();
    await feedPage.switchToYourFeed();
    // switchTo* methods each assert the correct tab gains the active class
  });
});
