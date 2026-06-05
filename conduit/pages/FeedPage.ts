import { Page, expect } from '@playwright/test';

export class FeedPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
    // The redesigned Conduit app removed the h1 banner — wait for the feed tab instead
    await expect(this.page.getByRole('link', { name: 'Global Feed' })).toBeVisible();
  }

  async switchToGlobalFeed(): Promise<void> {
    await this.page.getByRole('link', { name: 'Global Feed' }).click();
    await expect(this.page.getByRole('link', { name: 'Global Feed' })).toHaveClass(/active/);
  }

  async switchToYourFeed(): Promise<void> {
    await this.page.getByRole('link', { name: 'Your Feed' }).click();
    await expect(this.page.getByRole('link', { name: 'Your Feed' })).toHaveClass(/active/);
  }

  async clickArticle(title: string): Promise<void> {
    await this.page.getByRole('link', { name: title }).click();
    await this.page.waitForURL(/\/article\//);
  }

  async getArticleTitles(): Promise<string[]> {
    const titles = await this.page.getByRole('heading', { level: 1 }).allInnerTexts();
    return titles;
  }

  async clickTagFilter(tag: string): Promise<void> {
    await this.page.getByRole('link', { name: tag }).click();
    await expect(this.page.getByText(`# ${tag}`)).toBeVisible();
  }

  async getNavLinks(): Promise<string[]> {
    return this.page.getByRole('navigation').getByRole('link').allInnerTexts();
  }

  async clickNewArticle(): Promise<void> {
    await this.page.getByRole('link', { name: 'New Article' }).click();
    await this.page.waitForURL('/editor');
  }

  async clickProfile(username: string): Promise<void> {
    await this.page.getByRole('link', { name: username }).click();
    // This Conduit uses /profile/:username (not /@username)
    await this.page.waitForURL(new RegExp(`/profile/${username}`));
  }

  async assertUsernameInNav(username: string): Promise<void> {
    await expect(this.page.getByRole('navigation').getByRole('link', { name: username })).toBeVisible();
  }

  async assertArticleVisible(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible();
  }

  async assertHasArticles(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  }

  async gotoTagFeed(tag: string): Promise<void> {
    // page.goto('/?tag=x') doesn't trigger Angular's tag filter on initial load —
    // must navigate to the feed, wait for the tag to appear, then click its link
    await this.page.goto('/');
    await expect(this.page.getByRole('link', { name: 'Global Feed' })).toBeVisible();
    // exact: true prevents a substring match against article titles that contain the tag text
    await expect(this.page.getByRole('link', { name: tag, exact: true })).toBeVisible({ timeout: 10000 });
    await this.page.getByRole('link', { name: tag, exact: true }).click();
    // Angular renders the # as an <i class="ion-pound"> icon, not a text character;
    // confirm tag navigation by waiting for the /tag/:tag URL
    await this.page.waitForURL(new RegExp(`/tag/${encodeURIComponent(tag)}`), { timeout: 10000 });
  }
}
