import { expect, Page } from '@playwright/test';

import { AbstractPage } from './abstractPage';
import { logger } from '../utils/logger';

export class SessionPage extends AbstractPage {
  // --- User Session page indicators ---
  readonly sessionSummaryHeading = this.page.getByRole('heading', { name: /session summary/i });

  // --- Nectar Diagnostics section ---
  readonly nectarDiagnosticsPanel = this.page.locator('p-accordion-panel').filter({ hasText: /Nectar Diagnostics/ });
  readonly nectarDiagnosticsHeader = this.nectarDiagnosticsPanel.locator('p-accordion-header');
  readonly nectarDiagnosticsContent = this.nectarDiagnosticsPanel.locator('p-accordion-content');
  readonly nectarDiagnosticsRows = this.nectarDiagnosticsContent.locator('app-date-cell');

  // --- Related Call Details section ---
  readonly relatedCallDetailsPanel = this.page.locator('p-accordion-panel').filter({ hasText: /Call Sessions/ });
  readonly relatedCallDetailsHeader = this.relatedCallDetailsPanel.locator('p-accordion-header');
  readonly relatedCallDetailsContent = this.relatedCallDetailsPanel.locator('p-accordion-content');
  readonly relatedCallDetailsRows = this.relatedCallDetailsContent.locator('app-date-cell');

  constructor(page: Page) {
    super(page);
  }

  async verifyUserSessionPageOpened() {
    await expect(this.sessionSummaryHeading).toBeVisible();
  }

  async openNectarDiagnosticsSection() {
    await this.nectarDiagnosticsPanel.scrollIntoViewIfNeeded();
    await expect(this.nectarDiagnosticsPanel).toBeVisible({ timeout: 10000 });
    const isExpanded = await this.nectarDiagnosticsHeader.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.nectarDiagnosticsHeader.click();
      await this.page.waitForTimeout(500);
    }
    await this.nectarDiagnosticsRows.first().waitFor({ state: 'visible' });
  }

  async clickNectarDiagnosticsRow(rowIndex: number): Promise<void> {
    const row = this.nectarDiagnosticsRows.nth(rowIndex);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.dblclick();
    await this.page.waitForURL('**/callDetails/quality/nectar-diagnostic/session/**', { timeout: 30000 });
  }

  async verifyNdSessionPageOpened() {
    await expect(this.sessionSummaryHeading).toHaveText('Nectar Diagnostics Audio session summary');
  }

  async openRelatedCallDetailsSection() {
    await this.relatedCallDetailsPanel.scrollIntoViewIfNeeded();
    await expect(this.relatedCallDetailsPanel).toBeVisible({ timeout: 10000 });
    const isExpanded = await this.relatedCallDetailsHeader.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.relatedCallDetailsHeader.click();
      await this.page.waitForTimeout(500);
    }
    await this.relatedCallDetailsRows.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickRelatedCallDetailsRow(rowIndex = 0): Promise<void> {
    const row = this.relatedCallDetailsRows.nth(rowIndex);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.click();
    await this.page.waitForURL('**/dashboardui/callDetails/teams/pstn/**', { timeout: 30000 });
  }

  async verifyPreviousSessionPageOpened() {
    // After clicking a related session, the page should navigate to show that session's details
    await expect(this.sessionSummaryHeading).toHaveText('MS Teams Audio session summary');
    logger('[SessionPage] Previous Session page opened with sessions');
  }
}
