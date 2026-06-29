import { expect, Page } from '@playwright/test';

import { AbstractPage } from './abstractPage';

export class AdminPage extends AbstractPage {

    // =========================================================
    // Navigation Tabs
    // =========================================================
    readonly buttonAdminTab = this.page
        .locator('.dui-header-nav')
        .getByRole('link', { name: 'ADMIN' });

    readonly buttonRolesTab = this.page.getByRole('link', {
        name: 'Roles',
    });

    readonly buttonUsersTab = this.page
        .locator('.dui-header-nav')
        .getByRole('link', { name: 'USERS' });

    readonly buttonEventsTab = this.page
        .locator('.dui-header-nav')
        .getByRole('link', { name: 'EVENTS' });

    // =========================================================
    // Headers / Validators
    // =========================================================
    readonly headerUsers = this.page.getByRole('heading', {
        name: 'USERS',
    });

    readonly headerRoles = this.page.getByRole('heading', {
        name: 'ROLES',
    });

    readonly headerPinnedUsers = this.page
        .getByRole('heading', { name: 'PINNED USERS' })
        .first();

    readonly headerCurrentEvents = this.page
        .getByRole('heading', { name: 'CURRENT EVENTS' })
        .first();

    readonly headerUserRoleInformation = this.page
        .locator('.step-header')
        .getByText('User Role Information');

    readonly headerPageSettings = this.page
        .locator('.step-header')
        .getByText('Page Settings');

    // =========================================================
    // Role Management
    // =========================================================
    readonly buttonAddRole = this.page.getByRole('button', {
        name: 'ADD ROLE',
    });

    readonly textboxRoleName = this.page.getByRole('textbox', {
        name: 'Enter role Name',
    });

    readonly textboxRoleDescription = this.page.getByRole('textbox', {
        name: 'Enter role Description',
    });

    readonly radioUsersPermission = this.page
        .locator("(//span[text()='Users'])[2]")
        .filter({ has: this.page.getByText('Users') });

    readonly radioEventsPermission = this.page
        .locator("(//span[text()='Events'])[1]")
        .filter({ has: this.page.getByText('Events') });

    readonly searchRoleTextbox = this.page.getByRole('textbox', {
        name: 'Search',
        exact: true,
    });

    readonly gridRoleAutoAdmin = this.page
        .getByRole('gridcell', { name: 'AutoAdmin' })
        .first();

    readonly buttonDeleteRole = this.page.locator(
        '//div[@class="fill-color icon icon-remove ng-star-inserted"]',
    );

    // =========================================================
    // User Management
    // =========================================================
    readonly buttonAddUser = this.page.getByRole('button', {
        name: 'ADD USER',
    });

    readonly textboxFirstName = this.page.getByRole('textbox', {
        name: 'First Name',
    });

    readonly textboxLastName = this.page.getByRole('textbox', {
        name: 'Last Name',
    });

    readonly buttonReadonly = this.page.getByRole('button', {
        name: 'Readonly',
    });

    readonly dialogSearchRoleTextbox = this.page
        .getByRole('dialog')
        .getByRole('textbox', { name: 'Search', exact: true });

    readonly optionAutoAdminRole = this.page
        .locator(
            '(//ul//span[@tooltipstyleclass="common-tooltip no-break-word"])[1]',
        )
        .filter({ has: this.page.getByText('AutoAdmin') })
        .first();

    readonly textboxLoginEmail = this.page.getByRole('textbox', {
        name: 'example@example.com',
    });

    readonly checkboxManualPassword = this.page
        .locator('(//div[@tooltipstyleclass="checkbox-tooltip"]//label)[1]')
        .filter({ has: this.page.getByText('set password manually') })
        .first();

    readonly textboxPassword = this.page.locator(
        '(//input[@formcontrolname="password"])[1]',
    );

    readonly textboxConfirmPassword = this.page.locator(
        '(//input[@formcontrolname="confirm"])[1]',
    );

    readonly buttonAddUserConfirm = this.page.locator(
        '(//div[@class="user-form ng-star-inserted"]//following::button[text()=" Add "])[1]',
    );

    readonly searchCreatedUserTextbox = this.page
        .locator('(//div[@class="search-input-container resettable"])[1]')
        .getByRole('textbox', { name: 'Search', exact: true });

    readonly buttonDeleteUser = this.page.locator(
        '(//div[@class="fill-color icon icon-remove ng-star-inserted"])[1]',
    );

    // =========================================================
    // Common Buttons
    // =========================================================
    readonly buttonNext = this.page.getByRole('button', {
        name: 'NEXT',
    });

    readonly buttonSave = this.page.getByRole('button', {
        name: 'SAVE',
    });

    readonly buttonDeleteConfirm = this.page
        .getByRole('button', { name: 'DELETE' })
        .first();

    // =========================================================
    // Success / Toast Messages
    // =========================================================
    readonly messageSuccess = this.page.getByText(
        /success|added|created|saved/i,
    );

    readonly messageDeleted = this.page.getByText(
        /deleted|removed/i,
    );

    // =========================================================
    // Profile / Logout
    // =========================================================
    readonly buttonProfile = this.page.locator(
        '//div[@class="dui-header-login flex-container flex-vertical-center"]',
    );

    readonly buttonLogout = this.page.locator(
        '//span[text()="Log out"]',
    );

    constructor(page: Page) {
        super(page);
    }

    // =========================================================
    // Navigation Methods
    // =========================================================

    /**
     * Navigate to Admin tab
     */
    async clickAdminTab() {
        await expect(this.buttonAdminTab).toBeVisible();

        await this.buttonAdminTab.click();

        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        await this.verifyAdminTab();
    }

    /**
     * Verify Admin page loaded
     */
    async verifyAdminTab() {
        await this.page.waitForURL('**/dashboardui/admin**', {
            timeout: 30000,
        });

        await expect(this.headerUsers).toBeVisible();

        await this.headerUsers.scrollIntoViewIfNeeded();

        await this.page.waitForLoadState('load');
    }

    /**
     * Navigate to Roles tab
     */
    async clickRolesTab() {
        await this.clickAdminTab();

        await this.page.waitForLoadState('load');

        await this.buttonRolesTab.waitFor({
            state: 'attached',
        });

        await expect(this.buttonRolesTab).toBeVisible();

        await this.buttonRolesTab.click();

        await this.page.waitForLoadState('domcontentloaded');

        await this.verifyAdminRoleTab();
    }

    /**
     * Verify Roles page loaded
     */
    async verifyAdminRoleTab() {
        await this.page.waitForURL('**/dashboardui/admin/roles', {
            timeout: 30000,
        });

        await expect(this.headerRoles).toBeVisible();

        await this.headerRoles.scrollIntoViewIfNeeded();

        await this.page.waitForLoadState('load');
    }

    // =========================================================
    // Role Management Methods
    // =========================================================

    /**
     * Create new role
     */
    async clickCreateRoleButton(roleName: string, roleDescription: string) {

        await this.clickRolesTab();

        await expect(this.buttonAddRole).toBeVisible();

        await this.buttonAddRole.click();

        await this.page.waitForLoadState('load');

        await this.headerUserRoleInformation.waitFor({
            state: 'attached',
        });

        await expect(this.headerUserRoleInformation).toBeVisible();

        // Fill role information
        await expect(this.textboxRoleName).toBeVisible();
        await this.textboxRoleName.fill(roleName);

        await expect(this.textboxRoleDescription).toBeVisible();
        await this.textboxRoleDescription.fill(roleDescription);

        // Navigate to next step
        await expect(this.buttonNext).toBeVisible();

        await this.page.waitForTimeout(2000);

        await this.buttonNext.click();

        // Verify page settings
        await this.page.waitForLoadState('load');

        await expect(this.headerPageSettings).toBeVisible();

        // Select Users permission
        await this.radioUsersPermission.waitFor({
            state: 'attached',
        });

        await expect(this.radioUsersPermission).toBeVisible();

        await this.radioUsersPermission.click();

        // Select Events permission
        await this.radioEventsPermission.waitFor({
            state: 'attached',
        });

        await expect(this.radioEventsPermission).toBeVisible();

        await this.radioEventsPermission.click();

        // Navigate to Save page
        await this.buttonNext.click();

        await this.page.waitForLoadState('load');

        // Save role
        await expect(this.buttonSave).toBeVisible();

        await this.buttonSave.click();

        // Verify success message
        await this.page.waitForLoadState('load');

        await this.messageSuccess.waitFor({
            state: 'visible',
            timeout: 10000,
        });

        await expect(this.messageSuccess).toBeVisible();
    }

    /**
     * Delete created role
     */
    async clickDeleteRoleButton(roleName: string) {

        await this.clickRolesTab();

        // Search created role
        await this.page.waitForTimeout(2000);

        await this.searchRoleTextbox.pressSequentially(roleName);

        // Validate role visible
        await this.gridRoleAutoAdmin.waitFor({
            state: 'attached',
        });

        await expect(this.gridRoleAutoAdmin).toBeVisible();

        // Delete role
        await this.buttonDeleteRole.waitFor({
            state: 'visible',
        });

        await expect(this.buttonDeleteRole).toBeVisible();

        await this.buttonDeleteRole.click();

        await this.page.waitForTimeout(2000);

        // Confirm delete
        await this.buttonDeleteConfirm.waitFor({
            state: 'attached',
        });

        await expect(this.buttonDeleteConfirm).toBeVisible();

        await this.buttonDeleteConfirm.click();

        // Validate delete success
        await this.messageDeleted.waitFor({
            state: 'visible',
            timeout: 10000,
        });

        await expect(this.messageDeleted).toBeVisible();
    }

    // =========================================================
    // User Management Methods
    // =========================================================

    /**
     * Create new user
     */
    async clickCreateUserButton(firstName: string, lastName: string, role: string, linkedEmail: string, password: string, confirmPassword: string) {

        await this.clickAdminTab();

        // Click Add User
        if (!await this.buttonAddUser.isVisible()) {
            await this.buttonAddUser.click();
        } else {
            await this.buttonAddUser.waitFor({
                state: 'attached',
            });

            await expect(this.buttonAddUser).toBeVisible();

            await this.buttonAddUser.click();
        }

        await this.page.waitForLoadState('load');

        // Fill first name
        await this.textboxFirstName.waitFor({
            state: 'attached',
        });

        await expect(this.textboxFirstName).toBeVisible();

        await this.textboxFirstName.fill(firstName);

        // Fill last name
        await this.textboxLastName.waitFor({
            state: 'attached',
        });

        await expect(this.textboxLastName).toBeVisible();

        await this.textboxLastName.fill(lastName);

        // Select readonly
        await this.buttonReadonly.waitFor({
            state: 'attached',
        });

        await expect(this.buttonReadonly).toBeVisible();

        await this.buttonReadonly.click();

        // Search role
        await expect(this.dialogSearchRoleTextbox).toBeEnabled();

        await this.dialogSearchRoleTextbox.fill(role);

        // Select role
        await this.optionAutoAdminRole.waitFor({
            state: 'attached',
        });

        await expect(this.optionAutoAdminRole).toBeVisible();

        await this.optionAutoAdminRole.click();

        // Fill email
        await this.textboxLoginEmail.waitFor({
            state: 'attached',
        });

        await expect(this.textboxLoginEmail).toBeVisible();

        await this.textboxLoginEmail.fill(
            linkedEmail,
        );

        // Enable manual password
        await this.checkboxManualPassword.waitFor({
            state: 'attached',
        });

        await expect(this.checkboxManualPassword).toBeVisible();

        await this.checkboxManualPassword.click();

        // Fill password
        await this.textboxPassword.waitFor({
            state: 'attached',
        });

        await expect(this.textboxPassword).toBeVisible();

        await this.textboxPassword.pressSequentially(
            password,
        );

        // Confirm password
        await this.textboxConfirmPassword.waitFor({
            state: 'attached',
        });

        await expect(this.textboxConfirmPassword).toBeVisible();

        await this.textboxConfirmPassword.pressSequentially(
            confirmPassword,
        );

        // Add user
        await this.buttonAddUserConfirm.waitFor({
            state: 'attached',
        });

        await expect(this.buttonAddUserConfirm).toBeVisible();

        await this.buttonAddUserConfirm.click();

        // Validate success message
        await this.messageSuccess.waitFor({
            state: 'visible',
            timeout: 10000,
        });

        await expect(this.messageSuccess).toBeVisible();
    }

    /**
     * Delete created user
     */
    async newUserDelete(Username: string) {

        await this.clickAdminTab();

        // Search created user
        await this.searchCreatedUserTextbox.waitFor({
            state: 'visible',
        });

        await expect(this.searchCreatedUserTextbox).toBeVisible();

        await this.searchCreatedUserTextbox.fill(Username);

        await this.page.waitForLoadState('load');

        await this.page.waitForTimeout(2000);

        // Delete user
        await this.buttonDeleteUser.waitFor({
            state: 'visible',
            timeout: 20000,
        });

        await expect(this.buttonDeleteUser).toBeVisible();

        await this.buttonDeleteUser.click();

        // Confirm delete
        await this.buttonDeleteConfirm.waitFor({
            state: 'visible',
            timeout: 20000,
        });

        await expect(this.buttonDeleteConfirm).toBeVisible();

        await this.buttonDeleteConfirm.click();

        // Verify success
        await this.messageDeleted.waitFor({
            state: 'visible',
            timeout: 20000,
        });

        await expect(this.messageDeleted).toBeVisible();
    }

    // =========================================================
    // User Validation Methods
    // =========================================================

    /**
     * Verify newly created user has Users and Events access
     */
    async verifyNewUserCreatedwithUsersAndEvents() {

        await this.page.waitForLoadState('load');

        await this.page.waitForTimeout(5000);

        await this.page.reload();

        await this.page.waitForLoadState('load');

        // Verify Users tab
        await this.buttonUsersTab.waitFor({
            state: 'attached',
        });

        await expect(this.buttonUsersTab).toBeVisible();

        await this.buttonUsersTab.click();

        await this.page.waitForTimeout(2000);

        await expect(this.headerPinnedUsers).toBeVisible();

        // Verify Events tab
        await this.buttonEventsTab.waitFor({
            state: 'attached',
        });

        await expect(this.buttonEventsTab).toBeVisible();

        await this.buttonEventsTab.click();

        await this.page.waitForTimeout(2000);

        await expect(this.headerCurrentEvents).toBeVisible();
    }

    // =========================================================
    // Logout Methods
    // =========================================================

    /**
     * Logout from application
     */
    async logout() {

        // Open profile menu
        await expect(this.buttonProfile).toBeVisible();

        await this.buttonProfile.click();

        // Click logout
        await this.buttonLogout.waitFor({
            state: 'attached',
        });

        await expect(this.buttonLogout).toBeVisible();

        await this.buttonLogout.click();
    }
}