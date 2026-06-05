import { test, expect } from '../../../fixtures';
import { ArticlePage } from '../../pages/ArticlePage';
import { ApiUtils } from '../../utils/ApiUtils';
import testdata from '../../../data/testdata.json';

test.describe('Comments', () => {
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

  test('@regression post comment via UI is visible on article page', async ({ page, authenticatedPage, request }) => {
    const { token } = authenticatedPage;
    const apiUtils = new ApiUtils(request);
    const article = await apiUtils.createArticle(token, {
      title: `Comment Test ${Date.now()}`,
      description: testdata.articles.default.description,
      body: testdata.articles.default.body,
    });
    createdSlug = article.slug;

    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await articlePage.postComment(testdata.comments.default.body);
  });

  test('@regression posted comment can be deleted via UI', async ({ page, authenticatedPage, request }) => {
    const { token } = authenticatedPage;
    const apiUtils = new ApiUtils(request);
    const article = await apiUtils.createArticle(token, {
      title: `Delete Comment Test ${Date.now()}`,
      description: testdata.articles.default.description,
      body: testdata.articles.default.body,
    });
    createdSlug = article.slug;

    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await articlePage.postComment(testdata.comments.default.body);
    await articlePage.deleteComment(testdata.comments.default.body);
  });

  test('@regression comment box not shown to unauthenticated user', async ({ page, request }) => {
    // APP LIMITATION: articles created by the test account (hongngo123) return 404 for
    // anonymous requests on this demo server. Use a pre-existing public article instead.
    const apiUtils = new ApiUtils(request);
    const articles = await apiUtils.getArticles(1);
    const publicArticle = articles[0];

    // 'page' is unauthenticated — authenticatedPage fixture is intentionally NOT used
    const articlePage = new ArticlePage(page);
    await articlePage.goto(publicArticle.slug);
    await articlePage.assertCommentBoxHidden();
    // No createdSlug — no article was created, no cleanup needed
  });
});
