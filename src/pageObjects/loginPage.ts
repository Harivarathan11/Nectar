import { expect, Page } from '@playwright/test';

import { AbstractPage } from './abstractPage';

export class LoginPage extends AbstractPage {
  readonly inputUsername = this.page.locator('input[formcontrolname="username"]');
  readonly inputPassword = this.page.locator('input[formcontrolname="password"]');
  readonly buttonLogIn = this.page.getByRole('button', { name: 'Log In' });

  constructor(page: Page) {
    super(page);
  }

  async navigateToLogin() {
    await this.page.goto(process.env.APP_URL || '');
    await this.page.waitForLoadState('networkidle');
  }

  async login(username: string, password: string) {
    await this.inputUsername.fill(username);
    await this.inputPassword.click();
    await this.inputPassword.fill(password);
    await this.buttonLogIn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyUserLoggedIn() {
    await this.page.waitForURL('**/dashboard**', { timeout: 30000 });
  }
}
