import { Page, expect } from '@playwright/test';

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/register');
    await expect(this.page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
  }

  async register(username: string, email: string, password: string): Promise<void> {
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Username').fill(username);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Email').fill(email);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign up' }).click();
    await this.page.waitForURL('/');
  }
}
