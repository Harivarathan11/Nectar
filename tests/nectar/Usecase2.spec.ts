import { test } from '@playwright/test';

import { LoginPage } from '../../src/pageObjects/loginPage';
import { CallHistoricPage } from '../../src/pageObjects/callHistoricPage';
import { SessionPage } from '../../src/pageObjects/sessionPage';

const USERNAME = process.env.NECTAR_USERNAME || '';
const PASSWORD = process.env.NECTAR_PASSWORD || '';

test.describe('Call Historic Page > Session', { tag: '@poc' }, () => {
  let loginPage: LoginPage;
  let callHistoricPage: CallHistoricPage;
  let sessionPage: SessionPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    callHistoricPage = new CallHistoricPage(page);
    sessionPage = new SessionPage(page);
  });

  test('Verify Call Historic Session navigation flow', async () => {
    // Step 1: Login to Nectar DXP Application
    await test.step('Login to Nectar DXP Application', async () => {
      await loginPage.navigateToLogin();
      await loginPage.login(USERNAME, PASSWORD);
      await loginPage.verifyUserLoggedIn();
    });

    // Step 2: Click Call Details > Historic Tab
    await test.step('Click Call Details > Historic Tab', async () => {
      await callHistoricPage.clickCallDetailsTab();
      await callHistoricPage.clickHistoricTab();
      await callHistoricPage.verifyCallDetailsPageLoaded();
    });

    // Step 3: Select Time Period based on current date
    await test.step('Select Time Period based on current date', async () => {
      await callHistoricPage.resetFilters();
      await callHistoricPage.selectTimePeriodBasedOnDate();
    });

    // Step 4: Select Platform Filter as MS Teams and Session Type as PSTN/External
    await test.step('Select Platform as MS Teams and Session Type as PSTN/External', async () => {
      await callHistoricPage.selectPlatformMsTeams();
      await callHistoricPage.selectSessionTypePstnExternal();
    });

    // Step 5: Open Call Details Section and Click any Session Row
    await test.step('Open Call Sessions and click a Session Row', async () => {
      await callHistoricPage.openCallSessionsSection();
      await callHistoricPage.clickSessionRow(0);
      await sessionPage.verifyUserSessionPageOpened();
    });

    // Step 6: Under Nectar Diagnostics section, Open any Session Row
    await test.step('Open Nectar Diagnostics section and click Session Row', async () => {
      await sessionPage.openNectarDiagnosticsSection();
      await sessionPage.clickNectarDiagnosticsRow(0);
      await sessionPage.verifyNdSessionPageOpened();
    });

    // Step 7: Open Related Call Details Section and Click Session Row
    await test.step('Open Related Call Details and click Session Row and validate previous page opened', async () => {
      await sessionPage.openRelatedCallDetailsSection();
      await sessionPage.clickRelatedCallDetailsRow(0);
      await sessionPage.verifyPreviousSessionPageOpened();
    });
  });
});
