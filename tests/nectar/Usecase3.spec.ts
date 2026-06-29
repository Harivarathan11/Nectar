import { test, expect } from '@playwright/test';

import { LoginPage } from '../../src/pageObjects/loginPage';
import { UserPage } from '../../src/pageObjects/userPage';
import { AdminPage } from '../../src/pageObjects/adminPage';
import { UserApi, PinnedUsersResponse } from '../../src/api/userApi';
import { logger } from '../../src/utils/logger';
import { CallHistoricPage } from '../../src/pageObjects/callHistoricPage';


const USERNAME = process.env.NECTAR_USERNAME || '';
const PASSWORD = process.env.NECTAR_PASSWORD || '';
const TARGET_USER = 'Prabhu Velusamy';

test.describe('User Details Search', { tag: '@poc' }, () => {
    let loginPage: LoginPage;
    let userPage: UserPage;
    let adminPage: AdminPage;
    let userApi: UserApi;
    let pinnedUsersData: PinnedUsersResponse;
    let callHistoricPage: CallHistoricPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        userPage = new UserPage(page);
        adminPage = new AdminPage(page);
        userApi = new UserApi();
        callHistoricPage = new CallHistoricPage(page);
    });

    test.afterEach(async () => {
        // Cleanup: remove pinned user and dispose API
        await adminPage.clickAdminTab();
        await adminPage.verifyAdminTab();
        await userPage.removePinnedUser();

        if (userApi) {
            await userApi.dispose();
        }
    });

    test('Verify User Details Search and API Validation', async ({ page }) => {
        // Step 1: Login to Nectar DXP Application
        await test.step('Login to Nectar DXP Application', async () => {
            await loginPage.navigateToLogin();
            await loginPage.login(USERNAME, PASSWORD);
            await loginPage.verifyUserLoggedIn();
        });

        // Step 2: Search user in top searchbox and pin
        await test.step(`Search ${TARGET_USER} and click + icon to pin`, async () => {
            await userPage.searchUserAndPin(TARGET_USER);
            await userPage.verifyUserPinned();
            logger(`[User] ${TARGET_USER} pinned successfully`);
        });

        // Step 3: Navigate to Users Tab and verify pinned user
        await test.step('Click Users Tab and verify user visible', async () => {
            await userPage.clickUserTab();
            await userPage.verifyUserVisibleInList(TARGET_USER);
        });

        // Step 4: Capture auth cookies for API calls
        await test.step('Capture auth cookies for API calls', async () => {
            const cookies = await page.context().cookies();
            expect(cookies.length, 'Cookies should be present').toBeGreaterThan(0);
            await userApi.initialize(cookies);
        });

        // Step 5: Apply Date Filter and compare UI with API
        await test.step('Apply Date Filter and verify with API', async () => {
            await userPage.selectTimePeriodBasedOnDate();

            // Fetch API data after filter applied
            const pinnedUsersData = await userApi.getPinnedUsers();
            if (!pinnedUsersData) return;
            expect(pinnedUsersData, 'API should return pinned users data').not.toBeNull();
            expect(pinnedUsersData.totalElements).toBeGreaterThan(0);
            logger(`[API] Pinned users after date filter: ${pinnedUsersData.totalElements}`);

            // Compare UI grid with API response
            await userPage.verifyPinnedUsersWithApi(pinnedUsersData);
        });

        // Step 6: Apply Other Filter (Platform) and compare UI with API
        await test.step('Apply Platform Filter and verify with API', async () => {
            await userPage.selectPlatformMsTeams();

            // Fetch API data after platform filter applied
            const filteredData = await userApi.getPinnedUsers();
            if (!filteredData) return;
            expect(filteredData, 'API should return filtered data').not.toBeNull();
            logger(`[API] Pinned users after Platform filter: ${filteredData.totalElements}`);

            // Compare filtered UI with API
            await userPage.verifyPinnedUsersWithApi(filteredData);
        });

        // Step 7: Apply Other Filter (Platform) and compare UI with API
        await test.step('Apply Session Type Filter and verify with API', async () => {
            await callHistoricPage.selectSessionTypePstnExternal();

            // Fetch API data after platform filter applied
            const filteredData = await userApi.getPinnedUsers();
            if (!filteredData) return;
            expect(filteredData, 'API should return filtered data').not.toBeNull();
            logger(`[API] Pinned users after Session Type filter: ${filteredData.totalElements}`);

            // Compare filtered UI with API
            await userPage.verifyPinnedUsersWithApi(filteredData);
        });

        // Step 8: Click User to open User Overview page
        await test.step(`Click ${TARGET_USER} to open User Overview`, async () => {
            await userPage.clickUserFromList(TARGET_USER);
            await userPage.verifyUserOverviewPageOpened();
            logger(`[User] ${TARGET_USER} overview page opened`);
        });
    });
});
