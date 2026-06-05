import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Email').fill(email);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
    await this.page.waitForURL('/');
  }

  async attemptLogin(email: string, password: string): Promise<void> {
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Email').fill(email);
    // Conduit Angular app has no <label> elements — getByPlaceholder used as fallback.
    // In production, advocate for proper accessibility attributes.
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  async assertSignInButtonDisabled(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  }

  async getErrorMessage(): Promise<string> {
    const error = this.page.locator('.error-messages').getByRole('listitem').first();
    await expect(error).toBeVisible();
    return error.innerText();
  }
}
