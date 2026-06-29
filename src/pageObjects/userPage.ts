import { expect, Locator, Page } from '@playwright/test';

import { AbstractPage } from './abstractPage';
import { PinnedUsersResponse } from '../api/userApi';
import { logger } from '../utils/logger';

export class UserPage extends AbstractPage {
    // =========================================================
    // Navigation & Search
    // =========================================================
    readonly buttonUserTab = this.page
        .locator('.dui-header-nav')
        .getByRole('link', { name: 'USERS' });

    readonly headerPinnedUsers = this.page
        .getByRole('heading', { name: 'PINNED USERS' })
        .first();

    readonly inputSearchUsers = this.page
        .getByRole('textbox', { name: 'Search Users' })
        .first();

    readonly searchedUserPinIconTick = this.page
        .locator('(//*[@class="icon icon-tick"])[1]');

    readonly searchedUserPinIconPlus = this.page
        .locator('(//*[@class="icon icon-plus"])[2]');

    readonly buttonClearSearch = this.page
        .locator('//div[@class="remove-icon__wrapper"]').first();

    // =========================================================
    // Time Period Filter
    // =========================================================
    readonly buttonTimePeriodDropdown = this.page
        .locator('//div[@class="filters-holder"]')
        .getByText('TIME PERIOD:').first();

    readonly optionMonthToDate = this.page
        .locator('(//input[@id="period-Month To Now"]/ancestor::li)[1]');

    readonly optionLastMonth = this.page
        .locator('(//input[@id="period-Last Month"]/ancestor::li)[1]');

    readonly buttonApply = this.page
        .getByRole('button', { name: 'APPLY' }).first();

    // =========================================================
    // Modality Filter
    // =========================================================
    readonly buttonModalityDropdown = this.page
        .locator('//div[@class="filters-holder"]')
        .getByText('MODALITY:').first();

    readonly buttonDeselectAllModality = this.page
        .getByRole('button', { name: 'Deselect All', exact: true }).first();

    readonly buttonFilterApply = this.page
        .locator('//app-filter-apply-component//button[@class="btn btn-secondary"]');

    // =========================================================
    // Duration Filter
    // =========================================================
    readonly buttonDurationDropdown = this.page
        .locator('//div[@class="filters-holder"]')
        .getByText('DURATION:').first();

    // =========================================================
    // User List / Pinned Users Grid
    // =========================================================
    readonly pinnedUserCards = this.page
        .locator('.ag-center-cols-container .ag-row');

    readonly buttonUnpinUser = this.page
        .locator('//div[@col-id="remove-icon"]//div[@class="remove-icon__wrapper"]');

    readonly buttonConfirmRemove = this.page
        .getByRole('button', { name: 'REMOVE' });

    // =========================================================
    // User Overview Page
    // =========================================================
    readonly userOverviewHeader = this.page
        .locator('//span[text()="Overview"]');

    readonly qualitySummaryHeader = this.page
        .getByRole('heading', { name: 'QUALITY SUMMARY' });

    // =========================================================
    // Row Cell Locators (for pinned user grid)
    // =========================================================
    readonly pinnedUserName = (row: Locator) =>
        row.locator('.user-name');

    readonly pinnedUserEmail = (row: Locator) =>
        row.locator('[col-id="email"]');

    readonly pinnedUserLocation = (row: Locator) =>
        row.locator('[col-id="location"]');

    readonly pinnedUserSessionCount = (row: Locator) =>
        row.locator('[col-id="sessionCount"]');

    readonly pinnedUserSessionPoor = (row: Locator) =>
        row.locator('[col-id="sessionPoor"]');

    readonly pinnedUserNectarScore = (row: Locator) =>
        row.locator('[col-id="nectarScore"]');

    readonly pinnedUserAvgNectarScore = (row: Locator) =>
        row.locator('[col-id="nectarScoreAvg"]');

    readonly pinnedUserLastSessionDate = (row: Locator) =>
        row.locator('[col-id="lastSessionDate"]');

    readonly selectPlatformFilter = this.page.locator('app-dropdown-filter-component').filter({ hasText: 'Platform:' });
    readonly buttonPlatformDropdown = this.page.getByRole('button', { name: /Platform/ });
    readonly checkboxMsTeams = this.selectPlatformFilter.getByText('MS Teams');
    readonly buttonDeselectAll = this.page.getByRole('button', { name: 'Deselect all' });


    constructor(page: Page) {
        super(page);
    }

    // =========================================================
    // Navigation Methods
    // =========================================================

    async clickUserTab() {
        await expect(this.buttonUserTab).toBeVisible();
        await this.buttonUserTab.click();
        await this.verifyUserPageLoaded();
    }

    async verifyUserPageLoaded() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForURL('**/users**', { timeout: 30000 });
        await expect(this.headerPinnedUsers).toBeVisible();
    }

    // =========================================================
    // Search & Pin Methods
    // =========================================================

    async searchUserAndPin(username: string) {
        await expect(this.inputSearchUsers).toBeVisible();
        await this.inputSearchUsers.fill(username);
        await this.page.waitForLoadState('networkidle');

        await this.searchedUserPinIconPlus.waitFor({ state: 'visible', timeout: 10000 });
        await this.searchedUserPinIconPlus.click({ force: true });
        await this.page.waitForLoadState('load');
        await this.page.waitForTimeout(2000);

        await this.searchedUserPinIconTick.waitFor({ state: 'visible', timeout: 10000 });
        await expect(this.searchedUserPinIconTick).toBeVisible();
    }

    async verifyUserPinned() {
        await this.searchedUserPinIconTick.waitFor({ state: 'visible', timeout: 10000 });
        await expect(this.searchedUserPinIconTick).toBeVisible();
        await this.page.waitForLoadState('networkidle');
        await expect(this.searchedUserPinIconTick).toBeVisible();
        await this.page.locator('//input[@placeholder="Search users"]').click({ force: true });
    }

    async removePinnedUser() {
        await this.clickUserTab();
        await expect(this.buttonUnpinUser).toBeVisible({ timeout: 10000 });
        await this.buttonUnpinUser.click();
        await this.page.waitForLoadState('networkidle');

        await expect(this.buttonConfirmRemove).toBeVisible();
        await this.buttonConfirmRemove.click();
        await this.page.waitForLoadState('networkidle');
    }

    async verifyUserVisibleInList(username: string) {
        await this.page.waitForLoadState('networkidle');
        const pinnedUser = this.page.locator(`//*[@class="user-name" and text()="${username}"]`);
        await expect(pinnedUser).toBeVisible({ timeout: 10000 });
    }

    // =========================================================
    // Filter Methods
    // =========================================================

    async selectTimePeriodBasedOnDate() {
        const currentDate = new Date().getDate();
        await expect(this.buttonTimePeriodDropdown).toBeVisible();
        await this.buttonTimePeriodDropdown.click();
        await this.page.waitForLoadState('networkidle');

        const targetOption = currentDate > 15 ? this.optionMonthToDate : this.optionLastMonth;
        await expect(targetOption).toBeVisible();
        await targetOption.click();
        await this.page.waitForLoadState('networkidle');

        await expect(this.buttonApply).toBeVisible();
        await this.buttonApply.click();
        await this.page.waitForLoadState('networkidle');
    }

    // =========================================================
    // User Click & Navigation
    // =========================================================

    async clickUserFromList(username: string) {
        const userLink = this.page.locator(`//*[@class="user-name" and text()="${username}"]`).first();
        await expect(userLink).toBeVisible();
        await userLink.click();
        await this.page.waitForLoadState('networkidle');
    }

    async verifyUserOverviewPageOpened() {
        await expect(this.qualitySummaryHeader).toBeVisible({ timeout: 15000 });
        await expect(this.userOverviewHeader).toBeVisible();
    }

    // =========================================================
    // API vs UI Validation Methods
    // =========================================================

    /**
     * Compare pinned users grid data with API response, row by row.
     */
    async verifyPinnedUsersWithApi(apiData: PinnedUsersResponse) {
        logger('[Compare] === Pinned Users ===');

        await expect(this.pinnedUserCards.first()).toBeVisible({ timeout: 10000 });

        const uiRowCount = await this.pinnedUserCards.count();
        const apiElements = apiData.elements;
        const compareCount = Math.min(uiRowCount, apiElements.length);

        logger(`[Compare] API totalElements: ${apiData.totalElements}, page elements: ${apiElements.length}`);
        logger(`[Compare] UI rows: ${uiRowCount}`);

        for (let i = 0; i < compareCount; i++) {
            const row = this.pinnedUserCards.nth(i);
            const apiUser = apiElements[i];

            await row.scrollIntoViewIfNeeded();

            // UI values
            const uiName = (await this.pinnedUserName(row).textContent())?.trim() || '';
            const uiEmail = (await this.pinnedUserEmail(row).textContent())?.trim() || '';
            const uiLocation = (await this.pinnedUserLocation(row).textContent())?.trim() || '';
            const uiSessionCount = (await this.pinnedUserSessionCount(row).textContent())?.trim() || '';
            const uiSessionPoor = (await this.pinnedUserSessionPoor(row).textContent())?.trim() || '';

            // API values
            const apiName = apiUser.displayName || '';
            const apiEmail = apiUser.email || '';
            const apiLocation = apiUser.location || '';
            const apiSessionCount = String(apiUser.sessionCount ?? '');
            const apiSessionPoor = String(apiUser.sessionPoor ?? '');

            // Log comparison
            logger(`[Compare] User ${i + 1}:`);
            logger(`[Compare]   Name: UI="${uiName}", API="${apiName}"`);
            logger(`[Compare]   Email: UI="${uiEmail}", API="${apiEmail}"`);
            logger(`[Compare]   Location: UI="${uiLocation}", API="${apiLocation}"`);
            logger(`[Compare]   Session Count: UI="${uiSessionCount}", API="${apiSessionCount}"`);
            logger(`[Compare]   Session Poor: UI="${uiSessionPoor}", API="${apiSessionPoor}"`);

            // Assertions
            expect(uiName).toBe(apiName);
            expect(uiEmail).toBe(apiEmail);
            expect(uiLocation).toContain(apiLocation);
            expect(uiSessionCount).toBe(apiSessionCount);
            expect(uiSessionPoor).toBe(apiSessionPoor);
        }
    }

    async selectPlatformMsTeams() {
        await this.buttonPlatformDropdown.click();
        await this.buttonDeselectAll.waitFor({ state: 'visible' });
        await this.buttonDeselectAll.click();
        await this.checkboxMsTeams.click();
        const sessionSummaryResponse = this.page.waitForResponse(
            (resp) => resp.url().includes('/dashboardapi/user/pinned') && resp.status() === 200,
        );
        await this.buttonApply.click();
        await sessionSummaryResponse;
    }
}
