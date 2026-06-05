import { test, expect } from '../../../fixtures';
import { ArticlePage } from '../../pages/ArticlePage';
import { ApiUtils } from '../../utils/ApiUtils';
import testdata from '../../../data/testdata.json';

test.describe('Favorites', () => {
  // This Conduit version does not show the Favorite button on articles you own.
  // Tests use a pre-existing global-feed article from another author.
  let favoritedSlug: string | undefined;

  test.afterEach(async ({ request }) => {
    if (favoritedSlug) {
      const apiUtils = new ApiUtils(request);
      const token = await apiUtils.login(
        testdata.users.default.email,
        testdata.users.default.password,
      );
      await apiUtils.unfavoriteArticle(token, favoritedSlug);
      favoritedSlug = undefined;
    }
  });

  test('@regression favorite an article increments count by 1', async ({ page, authenticatedPage, request }) => {
    const { token } = authenticatedPage;
    const apiUtils = new ApiUtils(request);
    const articles = await apiUtils.getArticles(5);
    const target = articles.find((a) => a.author.username !== testdata.users.default.username)!;

    // Ensure we start in an unfavorited state for a clean baseline
    await apiUtils.unfavoriteArticle(token, target.slug);

    const articlePage = new ArticlePage(page);
    await articlePage.goto(target.slug);
    const countBefore = await articlePage.getFavoritesCount();

    await articlePage.likeArticle();
    const countAfter = await articlePage.getFavoritesCount();
    expect(countAfter).toBe(countBefore + 1);

    favoritedSlug = target.slug; // afterEach unfavorites via API
  });

  test('@regression unfavorite an article decrements count by 1', async ({ page, authenticatedPage, request }) => {
    const { token } = authenticatedPage;
    const apiUtils = new ApiUtils(request);
    const articles = await apiUtils.getArticles(5);
    const target = articles.find((a) => a.author.username !== testdata.users.default.username)!;

    // Seed a known favorited state via API so the test controls the starting count
    await apiUtils.favoriteArticle(token, target.slug);

    const articlePage = new ArticlePage(page);
    await articlePage.goto(target.slug);
    const countBefore = await articlePage.getFavoritesCount();

    await articlePage.unfavoriteArticle();
    const countAfter = await articlePage.getFavoritesCount();
    expect(countAfter).toBe(countBefore - 1);
    // No favoritedSlug — already unfavorited via UI
  });
});
