import { test } from '@playwright/test';

import { LoginPage } from '../../src/pageObjects/loginPage';
import { AdminPage } from '../../src/pageObjects/adminPage';
import { SummaryPage } from '../../src/pageObjects/summaryPage';
import { AdminApi } from '../../src/api/adminApi';

const ADMIN_USERNAME = process.env.NECTAR_USERNAME;
const ADMIN_PASSWORD = process.env.NECTAR_PASSWORD;

const NEW_USER_USERNAME = process.env.AUTOMATION_USERNAME;
const NEW_USER_PASSWORD = process.env.AUTOMATION_PASSWORD;

const ROLE_NAME = 'AutoAdmin';
const ROLE_DESCRIPTION = 'AutoAdmin role with all permissions';
const USER_FIRST_NAME = 'Automation';
const USER_LAST_NAME = 'User';

test.describe('Verify User Role Permissions', { tag: '@poc' }, () => {

  let loginPage: LoginPage;
  let adminPage: AdminPage;
  let summaryPage: SummaryPage;
  let adminApi: AdminApi;

  test.beforeEach(async ({ page }) => {

    loginPage = new LoginPage(page);
    adminPage = new AdminPage(page);
    summaryPage = new SummaryPage(page);
    adminApi = new AdminApi();

    // Cleanup: check via API if leftover user/role exists, delete via UI if found
    await loginPage.navigateToLogin();
    await loginPage.login(ADMIN_USERNAME, ADMIN_PASSWORD);
    await loginPage.verifyUserLoggedIn();

    // Navigate to admin page first to ensure session cookies are fully set
    await adminPage.clickAdminTab();

    const cookies = await page.context().cookies();
    await adminApi.initialize(cookies);

    const userExists = await adminApi.userExists(USER_FIRST_NAME);
    const roleExists = await adminApi.roleExists(ROLE_NAME);
    await adminApi.dispose();

    if (userExists) {
      await adminPage.newUserDelete(USER_FIRST_NAME);
    }
    if (roleExists) {
      await adminPage.clickDeleteRoleButton(ROLE_NAME);
    }

    await adminPage.logout();
    // Clear expired session state so test starts fresh
    await page.context().clearCookies();

  });

  test('Verify User and Role Permissions', async () => {

    // Step 1: Login as Admin User
    await test.step('Login as Admin User', async () => {

      await loginPage.navigateToLogin();

      await loginPage.login(
        ADMIN_USERNAME,
        ADMIN_PASSWORD
      );

      await loginPage.verifyUserLoggedIn();

    });

    // Step 2: Create New Role
    await test.step('Create New Role', async () => {

      await adminPage.clickCreateRoleButton(ROLE_NAME, ROLE_DESCRIPTION);

    });

    // Step 3: Create New User
    await test.step('Create New User With newly Created Role', async () => {

      await adminPage.clickCreateUserButton(USER_FIRST_NAME, USER_LAST_NAME, ROLE_NAME, NEW_USER_USERNAME, NEW_USER_PASSWORD, NEW_USER_PASSWORD);

    });

    // Step 4: Logout Admin User
    await test.step('Logout Admin User', async () => {

      await adminPage.logout();

    });

    // Step 5: Login with Newly Created User
    await test.step('Login with Newly Created User', async () => {

      await loginPage.login(
        NEW_USER_USERNAME,
        NEW_USER_PASSWORD
      );

      await loginPage.verifyUserLoggedIn();

    });

    // Step 6: Verify Summary Page Loaded
    await test.step('Verify Summary Page Loaded', async () => {

      await summaryPage.verifySummaryPageLoaded();

    });

    // Step 7: Verify User Role Permissions
    await test.step('Verify Users and Events Permissions', async () => {

      await adminPage.verifyNewUserCreatedwithUsersAndEvents();

    });

    // Step 8: Logout Newly Created User
    await test.step('Logout Newly Created User', async () => {

      await adminPage.logout();

    });

    // Step 9: Login Back as Admin User
    await test.step('Login Back as Admin User', async () => {

      await loginPage.login(
        ADMIN_USERNAME,
        ADMIN_PASSWORD
      );

      await loginPage.verifyUserLoggedIn();

    });

    // Step 10: Delete Created User
    await test.step('Delete Created User', async () => {

      await adminPage.newUserDelete(USER_FIRST_NAME);

    });

    // Step 11: Delete Created Role
    await test.step('Delete Created Role', async () => {

      await adminPage.clickDeleteRoleButton(ROLE_NAME);

    });

  });

});