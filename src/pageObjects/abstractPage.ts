import { Page } from '@playwright/test';

export class AbstractPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  protected async alertMessageHandlerToAccept() {
    this.page.once('dialog', (dialog) => {
      dialog.accept();
    });
  }

  protected async isSelectorExists(selector: string) {
    return (await this.page.$(selector).catch(() => null)) !== null;
  }

  protected async isSelectorVisible(selector: string) {
    return this.page.locator(selector).isVisible();
  }
}
