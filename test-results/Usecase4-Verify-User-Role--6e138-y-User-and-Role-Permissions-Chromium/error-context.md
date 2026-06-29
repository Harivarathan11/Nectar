# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Usecase4.spec.ts >> Verify User Role Permissions >> Verify User and Role Permissions
- Location: tests\nectar\Usecase4.spec.ts:61:7

# Error details

```
TimeoutError: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[formcontrolname="username"]')

```

# Test source

```ts
  1  | import { expect, Page } from '@playwright/test';
  2  | 
  3  | import { AbstractPage } from './abstractPage';
  4  | 
  5  | export class LoginPage extends AbstractPage {
  6  |   readonly inputUsername = this.page.locator('input[formcontrolname="username"]');
  7  |   readonly inputPassword = this.page.locator('input[formcontrolname="password"]');
  8  |   readonly buttonLogIn = this.page.getByRole('button', { name: 'Log In' });
  9  | 
  10 |   constructor(page: Page) {
  11 |     super(page);
  12 |   }
  13 | 
  14 |   async navigateToLogin() {
  15 |     await this.page.goto(process.env.APP_URL || '');
  16 |     await this.page.waitForLoadState('networkidle');
  17 |   }
  18 | 
  19 |   async login(username: string, password: string) {
> 20 |     await this.inputUsername.fill(username);
     |                              ^ TimeoutError: locator.fill: Timeout 30000ms exceeded.
  21 |     await this.inputPassword.click();
  22 |     await this.inputPassword.fill(password);
  23 |     await this.buttonLogIn.click();
  24 |     await this.page.waitForLoadState('networkidle');
  25 |   }
  26 | 
  27 |   async verifyUserLoggedIn() {
  28 |     await this.page.waitForURL('**/dashboard**', { timeout: 30000 });
  29 |   }
  30 | }
  31 | 
```