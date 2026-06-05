import { Page, expect } from '@playwright/test';

export class ProfilePage {
  constructor(private readonly page: Page) {}

  async goto(username: string): Promise<void> {
    // This Conduit uses /profile/:username routing (not /@username)
    await this.page.goto(`/profile/${username}`);
    // Username renders as <h4>, which getByRole('heading') matches at any level
    await expect(this.page.getByRole('heading', { name: username })).toBeVisible({ timeout: 10000 });
  }

  async followUser(): Promise<void> {
    // action-btn scopes to the follow/unfollow button; \bFollow\b avoids matching "Unfollow"
    await this.page.locator('button.action-btn').filter({ hasText: /\bFollow\b/ }).click();
    await expect(this.page.locator('button.action-btn').filter({ hasText: /\bUnfollow\b/ })).toBeVisible();
  }

  async unfollowUser(): Promise<void> {
    await this.page.locator('button.action-btn').filter({ hasText: /\bUnfollow\b/ }).click();
    await expect(this.page.locator('button.action-btn').filter({ hasText: /\bFollow\b/ })).toBeVisible();
  }

  async assertMyArticleVisible(title: string): Promise<void> {
    // Demo app labels this tab "My Posts", not "My Articles"
    await this.page.getByRole('link', { name: 'My Posts' }).click();
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible();
  }

  async getMyArticleTitles(): Promise<string[]> {
    await this.page.getByRole('link', { name: 'My Posts' }).click();
    return this.page.getByRole('heading', { level: 1 }).allInnerTexts();
  }
}
