import { Page, expect } from '@playwright/test';

export class EditorPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/editor');
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await expect(this.page.getByPlaceholder('Article Title')).toBeVisible();
  }

  async waitForEditor(): Promise<void> {
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await expect(this.page.getByPlaceholder('Article Title')).toBeVisible();
  }

  async fillArticle(title: string, description: string, body: string, tags?: string[]): Promise<void> {
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Article Title').fill(title);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder("What's this article about?").fill(description);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Write your article (in markdown)').fill(body);
    if (tags) {
      for (const tag of tags) {
        // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
        // In production, advocate for proper accessibility attributes.
        await this.page.getByPlaceholder('Enter tags').fill(tag);
        await this.page.getByPlaceholder('Enter tags').press('Enter');
      }
    }
  }

  async publish(): Promise<string> {
    await this.page.getByRole('button', { name: 'Publish Article' }).click();
    await this.page.waitForURL(/\/article\//);
    return this.page.url().split('/article/')[1];
  }

  async updateArticle(title: string, description: string, body: string): Promise<void> {
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Article Title').clear();
    await this.page.getByPlaceholder('Article Title').fill(title);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder("What's this article about?").clear();
    await this.page.getByPlaceholder("What's this article about?").fill(description);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Write your article (in markdown)').clear();
    await this.page.getByPlaceholder('Write your article (in markdown)').fill(body);
    await this.page.getByRole('button', { name: 'Publish Article' }).click();
    await this.page.waitForURL(/\/article\//);
  }
}
