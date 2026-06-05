import { Page, expect } from '@playwright/test';

export class ArticlePage {
  constructor(private readonly page: Page) {}

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/article/${slug}`);
    // Angular fetches article data async after route load — allow up to 15s for h1 to render
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  }

  async getTitle(): Promise<string> {
    return this.page.getByRole('heading', { level: 1 }).innerText();
  }

  async getBody(): Promise<string> {
    return this.page.getByRole('main').innerText();
  }

  async postComment(commentBody: string): Promise<void> {
    await this.page.getByRole('textbox', { name: /comment/i }).fill(commentBody);
    await this.page.getByRole('button', { name: 'Post Comment' }).click();
    await expect(this.page.getByText(commentBody)).toBeVisible();
  }

  async deleteComment(commentBody: string): Promise<void> {
    const commentCard = this.page.getByText(commentBody).locator('../..');
    // Delete icon is <i class="ion-trash-a"> inside <span class="mod-options">, not a <button>
    await commentCard.locator('i.ion-trash-a').click();
    await expect(this.page.getByText(commentBody)).not.toBeVisible();
  }

  async likeArticle(): Promise<void> {
    // btn-outline-primary = unfavorited state; avoids matching "Unfavorite Article" button
    await this.page.locator('button.btn-outline-primary').filter({ hasText: /Favorite/ }).first().click();
    // Wait for the button to transition to the favorited (btn-primary) state before returning,
    // so subsequent getFavoritesCount() reads the updated count rather than the stale pre-click value
    await expect(this.page.locator('button.btn-primary:not(.btn-outline-primary)').filter({ hasText: /Unfavorite/ }).first()).toBeVisible();
  }

  async unfavoriteArticle(): Promise<void> {
    await this.page.locator('button.btn-primary:not(.btn-outline-primary)').filter({ hasText: /Unfavorite/ }).first().click();
    // Wait for button to transition back to unfavorited state
    await expect(this.page.locator('button.btn-outline-primary').filter({ hasText: /Favorite/ }).first()).toBeVisible();
  }

  async getFavoritesCount(): Promise<number> {
    // This Conduit version embeds count in button text: "Favorite Article (2)"
    // No separate .counter span exists; parse the (N) from whichever state the button is in
    const btn = this.page
      .locator('button.btn-outline-primary, button.btn-primary')
      .filter({ hasText: /article/i })
      .first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    const text = await btn.innerText();
    const match = text.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async assertCommentBoxHidden(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Post Comment' })).not.toBeVisible();
  }

  async deleteArticle(): Promise<void> {
    await this.page.getByRole('button', { name: 'Delete Article' }).click();
    await this.page.waitForURL('/');
  }

  async clickEditArticle(): Promise<void> {
    await this.page.getByRole('link', { name: 'Edit Article' }).click();
  }
}
