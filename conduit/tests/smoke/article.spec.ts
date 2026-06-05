import { test, expect } from '../../../fixtures';
import { EditorPage } from '../../pages/EditorPage';
import { FeedPage } from '../../pages/FeedPage';
import { ArticlePage } from '../../pages/ArticlePage';
import { ApiUtils } from '../../utils/ApiUtils';
import testdata from '../../../data/testdata.json';

test.describe('Article', () => {
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

  test('@smoke create article via editor appears on global feed', async ({ page, authenticatedPage }) => {
    const title = `Smoke Article ${Date.now()}`;
    // Navigate via SPA link click rather than page.goto('/editor') to avoid a full page
    // reload — Angular's GET /api/user would re-run with a potentially invalidated token
    // when other tests log in concurrently as the same user.
    const feedPage = new FeedPage(page);
    await feedPage.clickNewArticle();
    const editorPage = new EditorPage(page);
    await editorPage.waitForEditor();
    await editorPage.fillArticle(
      title,
      testdata.articles.default.description,
      testdata.articles.default.body,
    );
    createdSlug = await editorPage.publish();

    const homeFeed = new FeedPage(page);
    await homeFeed.goto();
    await homeFeed.switchToGlobalFeed();
    await homeFeed.assertArticleVisible(title);
  });

  test('@smoke published article is accessible via URL without login', async ({ request, browser }) => {
    // The demo server restricts hongngo123 articles to authenticated users only.
    // Use a pre-existing global-feed article to verify public URL access works.
    const apiUtils = new ApiUtils(request);
    const articles = await apiUtils.getArticles(1);
    const publicArticle = articles[0];

    const freshContext = await browser.newContext({ baseURL: 'https://demo.realworld.show' });
    const freshPage = await freshContext.newPage();
    try {
      const articlePage = new ArticlePage(freshPage);
      await articlePage.goto(publicArticle.slug);
      const pageTitle = await articlePage.getTitle();
      expect(pageTitle).toContain(publicArticle.title);
    } finally {
      await freshContext.close();
    }
    // No createdSlug — no article was created, no cleanup needed
  });
});
