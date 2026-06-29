import { expect, Page } from '@playwright/test';

import { AbstractPage } from './abstractPage';

export class SummaryPage extends AbstractPage {
  readonly buttonSummaryTab = this.page.getByRole('link', { name: 'Summary' });
  readonly summaryPageContainer = this.page.locator('app-filter-time-period-component');
  readonly selectTimePeriod = this.page.locator('.time-period-filter button.dropdown-toggle');
  readonly optionMonthToDate = this.page.locator('label[for="period-Month To Now"]');
  readonly optionLastMonth = this.page.locator('label[for="period-Last month"]');
  readonly buttonApplyTimePeriod = this.page.locator('.time-period-footer').getByRole('button', { name: 'Apply' });
  readonly mapSection = this.page.locator('div.map.leaflet-container');
  readonly buttonCorporateLocationCircle = this.page.locator('.leaflet-marker-icon.mycluster[role="button"]');
  readonly locationPopup = this.page.locator('.leaflet-popup-content-wrapper');
  readonly locationRows = this.page.locator('tr.location-quality-row[data-location-clicker]');

  constructor(page: Page) {
    super(page);
  }

  async clickSummaryTab() {
    await this.buttonSummaryTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifySummaryPageLoaded() {
    await expect(this.summaryPageContainer).toBeVisible({ timeout: 30000 });
  }

  async selectTimePeriodBasedOnDate() {
    const currentDate = new Date().getDate();
    await this.selectTimePeriod.waitFor({ state: 'visible' });
    const targetOption = currentDate > 15 ? this.optionMonthToDate : this.optionLastMonth;

    await expect(async () => {
      await this.selectTimePeriod.click();
      await targetOption.waitFor({ state: 'visible', timeout: 3000 });
    }).toPass({ timeout: 15000 });

    await targetOption.click({ force: true });

    const mapResponsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/dashboardapi/quality/map?tenant=nectarcorp') && resp.status() === 200,
    );
    await this.buttonApplyTimePeriod.click({ force: true });
    await mapResponsePromise;
  }

  async clickCorporateLocationCircle(): Promise<string> {
    await this.mapSection.waitFor({ state: 'visible', timeout: 30000 });
    // Scroll map into view to avoid sticky header/filter overlays
    await this.mapSection.scrollIntoViewIfNeeded();
    // Wait for map markers to stabilize (they re-render during load)
    await this.page.waitForTimeout(3000);
    await this.buttonCorporateLocationCircle.first().click({ force: true });
    await this.locationPopup.waitFor({ state: 'visible', timeout: 10000 });
    // Read the location name from the first row before clicking
    const firstRow = this.locationRows.first();
    const locationName = ((await firstRow.locator('td').first().textContent()) || '').trim();
    // Click location row and wait for navigation to call details page
    await Promise.all([
      this.page.waitForResponse(
        (resp) => resp.url().includes('/dashboardapi/') && resp.status() === 200,
      ),
      firstRow.click(),
    ]);
    return locationName;
  }
}
