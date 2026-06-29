import { test, expect } from '@playwright/test';

import { LoginPage } from '../../src/pageObjects/loginPage';
import { SummaryPage } from '../../src/pageObjects/summaryPage';
import { CallDetailsPage } from '../../src/pageObjects/callDetailsPage';
import { DashboardApi, DashboardApiResponse } from '../../src/api/dashboardApi';
import { CallHistoricPage } from '../../src/pageObjects/callHistoricPage';

const USERNAME = process.env.NECTAR_USERNAME || '';
const PASSWORD = process.env.NECTAR_PASSWORD || '';

test.describe('Summary Corporate Locations', { tag: '@poc' }, () => {
  let loginPage: LoginPage;
  let summaryPage: SummaryPage;
  let callDetailsPage: CallDetailsPage;
  let dashboardApi: DashboardApi;
  let apiData: DashboardApiResponse;
  let callHistoricPage: CallHistoricPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    summaryPage = new SummaryPage(page);
    callDetailsPage = new CallDetailsPage(page);
    callHistoricPage = new CallHistoricPage(page);
    dashboardApi = new DashboardApi();
  });

  test.afterEach(async () => {
    if (dashboardApi) {
      await dashboardApi.dispose();
    }
  });

  test('Verify Summary Corporate Locations with API data', async ({ page }) => {
    // Step 1: Login to Nectar DXP Application
    await test.step('Login to Nectar DXP Application', async () => {
      await loginPage.navigateToLogin();
      await loginPage.login(USERNAME, PASSWORD);
      await loginPage.verifyUserLoggedIn();
    });

    // Step 2: Click Call Details > Historic Tab
    await test.step('Click Call Details > Historic Tab and Reset filters', async () => {
      await callHistoricPage.clickCallDetailsTab();
      await callHistoricPage.clickHistoricTab();
      await callHistoricPage.verifyCallDetailsPageLoaded();
      await callHistoricPage.resetFilters();
    });

    // Step 3: Click Summary Tab
    await test.step('Click Summary Tab and verify page loaded', async () => {
      await summaryPage.clickSummaryTab();
      await summaryPage.verifySummaryPageLoaded();
    });

    // Step 4: Select Time Period based on current date
    await test.step('Select Time Period based on current date', async () => {
      await summaryPage.selectTimePeriodBasedOnDate();
    });

    // Step 5: Click Corporate Location Circle Icon in Map Section
    await test.step('Click Corporate Location Circle Icon', async () => {
      const locationName = await summaryPage.clickCorporateLocationCircle();
      await callDetailsPage.verifyCallDetailsPageOpened();
      await callDetailsPage.verifySelectedLocationFilter(locationName);
    });

    // Capture auth cookies after full navigation (SESSION cookie set by this point)
    await test.step('Capture auth cookies for API calls', async () => {
      const cookies = await page.context().cookies();
      expect(cookies.length, 'Cookies should be present').toBeGreaterThan(0);
      await dashboardApi.initialize(cookies);
    });

    // Step 6: Fetch API data for comparison
    await test.step('Fetch API data for comparison', async () => {
      apiData = await dashboardApi.getAllDashboardData();
      // Verify API responses are not null
      expect(apiData.sessionSummary).not.toBeNull();
      expect(apiData.nectarScore).not.toBeNull();
    });

    // Step 7: Verify UI sections visible and compare data with API
    await test.step('Verify Nectar Score section and compare with API', async () => {
      await callDetailsPage.verifyNectarScoreWithApi(apiData);
    });

    await test.step('Verify Pie Chart and total sessions with API', async () => {
      await callDetailsPage.verifyPieChartWithApi(apiData);
    });

    await test.step('Verify Insights section and compare with API', async () => {
      await callDetailsPage.verifyInsightsWithApi(apiData);
    });

    await test.step('Verify Sessions Bar Graph with API', async () => {
      await callDetailsPage.verifyBarGraphWithApi(apiData);
    });

    await test.step('Verify Audio Quality section and compare with API', async () => {
      await callDetailsPage.verifyAudioQualityWithApi(apiData);
    });

    await test.step('Verify Video Quality section and compare with API', async () => {
      await callDetailsPage.verifyVideoQualityWithApi(apiData);
    });

    await test.step('Verify App Sharing Quality section and compare with API', async () => {
      await callDetailsPage.verifyAppshareQualityWithApi(apiData);
    });

    await test.step('Verify Session Rows with API', async () => {
      await callDetailsPage.verifySessionRowsWithApi(apiData);
    });
  });
});
