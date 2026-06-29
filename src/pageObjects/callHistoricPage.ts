import { expect, Page } from '@playwright/test';

import { AbstractPage } from './abstractPage';

export class CallHistoricPage extends AbstractPage {
  // --- Navigation ---
  readonly buttonCallDetailsTab = this.page.getByRole('button', { name: 'Call Details' });
  readonly buttonHistoricTab = this.page.getByRole('menuitem', { name: 'Historic' });

  // --- Time Period filter ---
  readonly selectTimePeriod = this.page.getByRole('button', { name: /Time Period/ });
  readonly optionMonthToDate = this.page.locator('label[for="period-Month To Now"]');
  readonly optionLastMonth = this.page.locator('label[for="period-Last month"]');
  readonly buttonApply = this.page.getByRole('button', { name: 'Apply' });

  // --- Reset filters ---
  readonly buttonResetFilters = this.page.getByRole('button', { name: 'Reset filters' });

  // --- Platform filter ---
  readonly selectPlatformFilter = this.page.locator('app-dropdown-filter-component').filter({ hasText: 'Platform:' });
  readonly buttonPlatformDropdown = this.page.getByRole('button', { name: /Platform/ });
  readonly checkboxMsTeams = this.selectPlatformFilter.getByText('MS Teams');

  // --- Session Type filter ---
  readonly selectSessionTypeFilter = this.page.locator('app-dropdown-filter-component').filter({ hasText: 'Session Type:' });
  readonly buttonSessionTypeDropdown = this.page.getByRole('button', { name: /Session Type/ });
  readonly checkboxPstnExternal = this.selectSessionTypeFilter.getByText('PSTN/External');

  // --- Shared dropdown actions (only one dropdown open at a time) ---
  readonly buttonDeselectAll = this.page.getByRole('button', { name: 'Deselect all' });
  // readonly buttonApplyFilter = this.page.locator('app-filter-apply-component').getByRole('button', { name: 'Apply' });

  // --- Call Details / Sessions section ---
  readonly sessionListPanel = this.page.locator('p-accordion-panel').filter({ hasText: /CALL SESSIONS|Sessions/ });
  readonly sessionListHeader = this.sessionListPanel.locator('p-accordion-header');
  readonly sessionListContent = this.sessionListPanel.locator('p-accordion-content');
  readonly sessionGridRows = this.sessionListContent.locator('app-date-cell');

  constructor(page: Page) {
    super(page);
  }

  async clickCallDetailsTab() {
    await this.buttonCallDetailsTab.click();
  }

  async clickHistoricTab() {
    await this.buttonHistoricTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyCallDetailsPageLoaded() {
    await this.page.waitForURL('**/dashboardui/callDetails/historic**');
    await expect(this.selectTimePeriod).toBeVisible({ timeout: 30000 });
  }

  async selectTimePeriodBasedOnDate() {
    const currentDate = new Date().getDate();
    const targetOption = currentDate > 15 ? this.optionLastMonth : this.optionLastMonth;

    await this.selectTimePeriod.waitFor({ state: 'visible' });

    await expect(async () => {
      await this.selectTimePeriod.click();
      await targetOption.waitFor({ state: 'visible', timeout: 3000 });
    }).toPass({ timeout: 15000 });

    await targetOption.click({ force: true });

    const sessionSummaryResponse = this.page.waitForResponse(
      (resp) => resp.url().includes('/dashboardapi/session/summary?tenant=nectarcorp') && resp.status() === 200,
    );
    await this.buttonApply.click({ force: true });
    await sessionSummaryResponse;
  }

  async resetFilters() {
    const userPreferencesResponse = this.page.waitForResponse(
      (resp) => resp.url().includes('/adminapi/user/preferences?tenant=nectarcorp') && resp.request().method() === 'POST' && resp.status() === 200,
    );
    await this.buttonResetFilters.click();
    await userPreferencesResponse;
  }

  async selectPlatformMsTeams() {
    await this.buttonPlatformDropdown.click();
    await this.buttonDeselectAll.waitFor({ state: 'visible' });
    await this.buttonDeselectAll.click();
    await this.checkboxMsTeams.click();
    const sessionSummaryResponse = this.page.waitForResponse(
      (resp) => resp.url().includes('/dashboardapi/session/summary?tenant=nectarcorp') && resp.status() === 200,
    );
    await this.buttonApply.click();
    await sessionSummaryResponse;
  }

  async selectSessionTypePstnExternal() {
    await this.buttonSessionTypeDropdown.click();
    await this.buttonDeselectAll.waitFor({ state: 'visible' });
    await this.buttonDeselectAll.click();
    await this.checkboxPstnExternal.click();
    await this.buttonApply.click();
   
  }

  async openCallSessionsSection() {
    await this.sessionListPanel.scrollIntoViewIfNeeded();
    await expect(this.sessionListPanel).toBeVisible();
    const isExpanded = await this.sessionListHeader.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.sessionListHeader.scrollIntoViewIfNeeded();
      await this.sessionListHeader.click();
      await this.page.waitForTimeout(1000);
    }
    await this.sessionGridRows.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickSessionRow(rowIndex: number): Promise<void> {
    const row = this.sessionGridRows.nth(rowIndex);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.dblclick();
    await this.page.waitForURL('**/dashboardui/callDetails/teams/pstn/**', { timeout: 30000 });
  }
}
