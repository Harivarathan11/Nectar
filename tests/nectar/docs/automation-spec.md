# Nectar DXP – Automation Spec Guide

> Use this document as a blueprint to create new Playwright automation scripts for any manual test scenario in the Nectar DXP application.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Environment Setup](#environment-setup)
3. [Run Command Pattern](#run-command-pattern)
4. [Test File Template](#test-file-template)
5. [Available Page Objects](#available-page-objects)
6. [API Client Usage](#api-client-usage)
7. [Common Patterns & Conventions](#common-patterns--conventions)
8. [Locator Strategy](#locator-strategy)
9. [Enum Mappings](#enum-mappings)
10. [Writing a New Usecase (Step-by-Step)](#writing-a-new-usecase-step-by-step)
11. [Existing Usecases Reference](#existing-usecases-reference)

---

## Project Structure

```
Nectar/
├── config/nectar.config.ts             # Playwright config (timeout, retries, projects)
├── globalSetup.ts                      # Loads environment variables from .env files
├── environments/.env.{TEST_ENV}        # Per-environment variables (release, staging, etc.)
├── src/
│   ├── pageObjects/
│   │   ├── abstractPage.ts             # Base class (page ref, wait, dialog handler)
│   │   ├── loginPage.ts                # Login/logout actions
│   │   ├── summaryPage.ts              # Summary tab, time period, map interactions
│   │   ├── callDetailsPage.ts          # Call Details verifications + API comparisons
│   │   ├── callHistoricPage.ts         # Historic tab, filters, session grid
│   │   ├── sessionPage.ts             # Individual session page, diagnostics
│   │   └── adminPage.ts               # Admin panel (roles, users, events)
│   ├── api/
│   │   └── dashboardApi.ts            # Dashboard API client (all endpoints)
│   ├── enums/nectar/
│   │   ├── qualityType.enum.ts        # Quality type labels (PEER2PEER → "Peer To Peer")
│   │   ├── sessionType.enum.ts        # Session type mapping
│   │   └── sessionScenario.enum.ts    # Session scenario mapping
│   ├── utils/
│   │   ├── logger.ts                  # Timestamped console logger
│   │   └── apiHelper.ts              # Reusable API helper utility
│   └── cliReporterWithSteps.ts        # Custom CLI reporter with step output
└── tests/nectar/
    ├── Usecase1.spec.ts               # Summary Corporate Locations + API validation
    ├── Usecase2.spec.ts               # Call Historic → Session navigation flow
    ├── Usecase4.spec.ts               # User Role Permissions (CRUD)
    └── docs/                          # This documentation folder
```

---

## Environment Setup

### Environment Variables (loaded via `globalSetup.ts`)

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_ENV` | Yes | Environment name (e.g., `release`, `staging`) – loads `environments/.env.{TEST_ENV}` |
| `NECTAR_USERNAME` | Yes | Primary login username |
| `NECTAR_PASSWORD` | Yes | Primary login password |
| `APP_URL` | Yes | Application base URL (e.g., `https://release.lab1.test.nectarvoip.com`) |
| `NECTAR_API_BASE_URL` | No | API base URL (defaults to `{APP_URL}/dashboardapi`) |
| `NECTAR_TENANT` | No | Tenant identifier (defaults to `nectarcorp`) |
| `AUTOMATION_USERNAME` | No | Secondary user for role/permission tests |
| `AUTOMATION_PASSWORD` | No | Secondary user password |
| `ENABLE_LOGS` | No | Set to `true` for verbose list reporter |

### Playwright Config Defaults (`config/nectar.config.ts`)

```typescript
timeout: 3 * 60 * 1000,    // 3 minutes per test
retries: 0,                 // No auto-retry
workers: 1,                 // Sequential execution
viewport: { width: 1280, height: 800 },
actionTimeout: 20000,       // 20s per action
trace: 'on',                // Always capture trace
screenshot: 'only-on-failure',
video: 'retain-on-failure',
```

---

## Run Command Pattern

```powershell
# Set environment and run a specific test
$env:TEST_ENV='release'; npx playwright test --config=config/nectar.config.ts tests/nectar/{UsecaseX}.spec.ts --project=Chromium --headed

# Run all tests
$env:TEST_ENV='release'; npx playwright test --config=config/nectar.config.ts --project=Chromium

# Run by tag
$env:TEST_ENV='release'; npx playwright test --config=config/nectar.config.ts --grep @poc
```

---

## Test File Template

Use this skeleton for any new usecase:

```typescript
import { test, expect } from '@playwright/test';

import { LoginPage } from '../../src/pageObjects/loginPage';
// Import other page objects as needed
// import { DashboardApi, DashboardApiResponse } from '../../src/api/dashboardApi';

const USERNAME = process.env.NECTAR_USERNAME;
const PASSWORD = process.env.NECTAR_PASSWORD;

test.describe('Usecase Title', { tag: '@poc' }, () => {
  let loginPage: LoginPage;
  // Declare other page objects and variables

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    // Initialize other page objects
  });

  test.afterEach(async () => {
    // Cleanup (e.g., dispose API contexts)
  });

  test('Test scenario name', async ({ page }) => {
    // Step 1: Login
    await test.step('Login to Nectar DXP Application', async () => {
      await loginPage.navigateToLogin();
      await loginPage.login(USERNAME, PASSWORD);
      await loginPage.verifyUserLoggedIn();
    });

    // Step 2+: Your test steps
    await test.step('Step description', async () => {
      // actions and assertions
    });
  });
});
```

---

## Available Page Objects

### LoginPage (`src/pageObjects/loginPage.ts`)

| Method | Description |
|--------|-------------|
| `navigateToLogin()` | Go to APP_URL, wait for networkidle |
| `login(username, password)` | Fill credentials and submit |
| `verifyUserLoggedIn()` | Assert URL contains `/dashboard` |

---

### SummaryPage (`src/pageObjects/summaryPage.ts`)

| Method | Description |
|--------|-------------|
| `clickSummaryTab()` | Navigate to Summary view |
| `verifySummaryPageLoaded()` | Assert time period filter visible |
| `selectTimePeriodBasedOnDate()` | Auto-select Month To Now or Last Month based on current date (>15 = MTD) |
| `clickCorporateLocationCircle()` | Click map marker → popup → first location row; returns location name |

**Key Locators:**
- Map: `div.map.leaflet-container`
- Markers: `.leaflet-marker-icon.mycluster[role="button"]`
- Location popup: `.leaflet-popup-content-wrapper`
- Location rows: `tr.location-quality-row[data-location-clicker]`

---

### CallHistoricPage (`src/pageObjects/callHistoricPage.ts`)

| Method | Description |
|--------|-------------|
| `clickCallDetailsTab()` | Click "Call Details" in nav |
| `clickHistoricTab()` | Click "Historic" submenu |
| `verifyCallDetailsPageLoaded()` | Assert URL + time period filter |
| `resetFilters()` | Click "Reset filters", wait for API |
| `selectTimePeriodBasedOnDate()` | Select time period and apply |
| `selectPlatformMsTeams()` | Filter by MS Teams platform |
| `selectSessionTypePstnExternal()` | Filter by PSTN/External |
| `openCallSessionsSection()` | Expand CALL SESSIONS accordion |
| `clickSessionRow(index)` | Double-click a session row to navigate |

**Key Locators:**
- Call Details button: `button` name "Call Details"
- Historic menuitem: `menuitem` name "Historic"
- Session panel: `p-accordion-panel` with text "CALL SESSIONS"
- Session rows: `p-accordion-content app-date-cell`

---

### CallDetailsPage (`src/pageObjects/callDetailsPage.ts`)

| Method | Description |
|--------|-------------|
| `verifyCallDetailsPageOpened()` | Assert location filter visible |
| `verifySelectedLocationFilter(name)` | Verify location checkbox is checked |
| `verifyNectarScoreWithApi(apiData)` | Compare nectar score + legend groups |
| `verifyPieChartWithApi(apiData)` | Compare pie chart total + legend groups |
| `verifyInsightsWithApi(apiData)` | Compare insight bar percentages |
| `verifyBarGraphWithApi(apiData)` | Compare daily bar chart (hover tooltips) |
| `verifyAudioQualityWithApi(apiData)` | Compare audio metrics per quality type |
| `verifyVideoQualityWithApi(apiData)` | Compare video metrics per quality type |
| `verifyAppshareQualityWithApi(apiData)` | Compare app sharing metrics |
| `verifySessionRowsWithApi(apiData)` | Compare session table row by row |

**Key Sections and Locators:**

| Section | Container Locator |
|---------|-------------------|
| Nectar Score | `app-avg-nectar-score-card` |
| Session Summary (Pie) | `app-session-summary-card` |
| Insights | `app-session-insights-card` |
| Bar Graph | `app-extended-bar-chart` |
| Audio Quality | `p-accordion-panel` with text "Audio" |
| Video Quality | `p-accordion-panel` with text "Video" |
| App Sharing Quality | `p-accordion-panel` with text "App Sharing" |
| Call Sessions | `p-accordion-panel` with text "CALL SESSIONS" |

---

### SessionPage (`src/pageObjects/sessionPage.ts`)

| Method | Description |
|--------|-------------|
| `verifyUserSessionPageOpened()` | Assert "session summary" heading |
| `openNectarDiagnosticsSection()` | Expand ND accordion |
| `clickNectarDiagnosticsRow(index)` | Double-click ND row to navigate |
| `verifyNdSessionPageOpened()` | Assert ND session heading |
| `openRelatedCallDetailsSection()` | Expand related sessions accordion |
| `clickRelatedCallDetailsRow(index)` | Click related session row |
| `verifyPreviousSessionPageOpened()` | Assert MS Teams session heading |

---

### AdminPage (`src/pageObjects/adminPage.ts`)

| Method | Description |
|--------|-------------|
| `clickCreateRoleButton(name, description)` | Create a new role with permissions |
| `clickCreateUserButton(first, last, role, username, pwd, confirmPwd)` | Create a new user |
| `logout()` | Logout current user |
| `verifyNewUserCreatedwithUsersAndEvents()` | Verify role-based permissions |
| `newUserDelete(firstName)` | Delete a user by name |
| `clickDeleteRoleButton(roleName)` | Delete a role by name |

---

## API Client Usage

### DashboardApi (`src/api/dashboardApi.ts`)

```typescript
// 1. Declare in test describe block
let dashboardApi: DashboardApi;

// 2. Initialize in beforeEach
dashboardApi = new DashboardApi();

// 3. After UI login + navigation, capture cookies
const cookies = await page.context().cookies();
await dashboardApi.initialize(cookies);

// 4. Fetch all data in parallel
const apiData = await dashboardApi.getAllDashboardData();

// 5. Use apiData in verification steps
await callDetailsPage.verifyNectarScoreWithApi(apiData);

// 6. Dispose in afterEach
await dashboardApi.dispose();
```

### Available API Methods

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getSessionSummary()` | `GET /session/summary` | `SessionSummaryData` |
| `getNectarScore()` | `GET /session/summary/nectarscore` | `NectarScoreData` |
| `getInsights()` | `GET /session/summary/insights` | `InsightsData` |
| `getNectarScoreBarGraph()` | `GET /quality/nectarscore/bar/graph` | `BarGraphData` |
| `getAudioQuality()` | `GET /quality/session/audio` | `QualitySessionData` |
| `getVideoQuality()` | `GET /quality/session/video` | `QualitySessionData` |
| `getAppshareQuality()` | `GET /quality/session/appshare` | `QualitySessionData` |
| `getSessions(page, size, dir, field)` | `GET /session` | `SessionListData` |
| `getAllDashboardData()` | All above in parallel | `DashboardApiResponse` |

### ApiHelper (`src/utils/apiHelper.ts`)

A lighter reusable utility for custom API calls:

```typescript
const apiHelper = new ApiHelper({ baseUrl: '...', tenant: '...' });
await apiHelper.initialize(cookies);
const response = await apiHelper.get('/your/endpoint');
```

---

## Common Patterns & Conventions

### 1. Scroll Into View (Elements Below the Fold)

Always scroll before interacting with elements that may be off-screen:

```typescript
await element.scrollIntoViewIfNeeded();
```

**Apply to:** Accordion panels, table rows during iteration, map sections, any element below the initial viewport.

### 2. Accordion Expansion

Standard pattern to expand a collapsed accordion:

```typescript
await panel.scrollIntoViewIfNeeded();
await expect(panel).toBeVisible({ timeout: 10000 });
const isExpanded = await header.getAttribute('aria-expanded');
if (isExpanded !== 'true') {
  await header.click();
  await this.page.waitForTimeout(500);
}
await contentRows.first().waitFor({ state: 'visible', timeout: 10000 });
```

### 3. Retry Pattern for Flaky Dropdowns

Use `expect().toPass()` for interactions that may need retries:

```typescript
await expect(async () => {
  await dropdown.click();
  await option.waitFor({ state: 'visible', timeout: 3000 });
}).toPass({ timeout: 15000 });
```

### 4. Wait for API Response Before Proceeding

Intercept network responses after actions that trigger API calls:

```typescript
const responsePromise = this.page.waitForResponse(
  (resp) => resp.url().includes('/dashboardapi/endpoint') && resp.status() === 200,
);
await actionButton.click();
await responsePromise;
```

### 5. Page Object Locator Declaration

Declare locators as `readonly` class properties (evaluated lazily):

```typescript
export class MyPage extends AbstractPage {
  readonly myButton = this.page.getByRole('button', { name: 'Submit' });
  readonly myPanel = this.page.locator('p-accordion-panel').filter({ hasText: 'Section' });
  
  // Dynamic locator (function)
  readonly myItem = (name: string) => this.page.locator('.item').filter({ hasText: name });
}
```

### 6. Logger Usage

Log comparison data for debugging:

```typescript
import { logger } from '../utils/logger';

logger(`[Compare] Field: UI="${uiValue}", API="${apiValue}"`);
// Output: [2026-05-27T10:30:00.000Z] [Compare] Field: UI="95%", API="95%"
```

### 7. Row Iteration with Scroll

When iterating table rows, scroll each row into view:

```typescript
for (let i = 0; i < rowCount; i++) {
  const row = this.gridRows.nth(i);
  await row.scrollIntoViewIfNeeded();
  // ... read cell values
}
```

### 8. API Data Comparison Pattern

```typescript
async verifyWithApi(apiData: ApiResponse) {
  // Guard clause
  if (!apiData.section || apiData.section.length === 0) return;

  // Scroll + expand section
  await this.sectionPanel.scrollIntoViewIfNeeded();
  await expect(this.sectionPanel).toBeVisible();

  // Read UI values
  const uiValue = (await this.element.textContent()) || '';

  // Compare
  logger(`[Compare] Field: UI="${uiValue.trim()}", API="${expected}"`);
  expect(uiValue.trim()).toBe(expected);
}
```

### 9. Time Period Selection Logic

```
If current date > 15 → select "Month To Now" (current month has enough data)
If current date ≤ 15 → select "Last month" (current month too early)
```

### 10. Cookie-Based API Authentication

```typescript
// Extract cookies from browser after login
const cookies = await page.context().cookies();
// Initialize API with session cookies + XSRF token
await apiClient.initialize(cookies);
```

---

## Locator Strategy

### Priority Order (Best → Worst)

1. **Role-based:** `getByRole('button', { name: 'Submit' })`
2. **Text-based:** `getByText('Submit')`, `filter({ hasText: '...' })`
3. **Label-based:** `getByLabel('Email')`
4. **Test ID:** `getByTestId('submit-btn')` (if available)
5. **CSS Selector:** `locator('.class-name')`, `locator('[attribute="value"]')`
6. **XPath:** Last resort only

### Common Locator Patterns in Nectar DXP

| Pattern | Example | Use Case |
|---------|---------|----------|
| Accordion panel | `page.locator('p-accordion-panel').filter({ hasText: 'Title' })` | Any collapsible section |
| Grid row | `locator('.ag-center-cols-container div[role="row"]')` | ag-Grid tables |
| Cell by column | `row.locator('[col-id="fieldName"]')` | Specific grid cell |
| Filter component | `locator('app-single-filter-with-selected-values').filter({ hasText: 'Label:' })` | Dropdown filters |
| Highcharts element | `locator('.highcharts-title')`, `locator('.highcharts-series')` | Charts/graphs |
| Legend items | `locator('.legend-name')`, `locator('.legend-value')` | Chart legends |
| Navigation | `getByRole('button', { name: 'Tab' })` or `getByRole('link', { name: 'Tab' })` | Top nav |

---

## Enum Mappings

### Quality Types (`qualityType.enum.ts`)

| API Value | UI Label |
|-----------|----------|
| `PEER2PEER` | Peer To Peer |
| `PSTN` | PSTN/External |
| `CONFERENCE` | Conference |
| `WEBINAR` | Webinar |

### Session Types (`sessionType.enum.ts`)

| API Value | UI Label |
|-----------|----------|
| `PEER_TO_PEER` | Peer To Peer |
| `PEER_TO_PEER_MULTIMEDIA` | Peer To Peer (Multimedia) |
| `PEER2PEER` | Peer To Peer |
| `CONFERENCE` | Conference |
| `WEBINAR` | Webinar |

### Session Scenarios (`sessionScenario.enum.ts`)

| API Value | UI Label |
|-----------|----------|
| `INTERNAL` | Internal |
| `EXTERNAL` | External |
| `FEDERATED` | Federated |

---

## Writing a New Usecase (Step-by-Step)

### Phase 1: Define the Manual Scenario

Before writing code, document:

1. **Objective** – What is being verified?
2. **Preconditions** – Required users, data, configurations
3. **Steps** – Numbered manual actions with expected results
4. **Verifications** – What data to validate (UI-only or UI vs API?)

### Phase 2: Identify Page Objects Needed

- Check existing page objects (listed above)
- If new pages/sections are needed → create new page object extending `AbstractPage`
- If new API endpoints are needed → add methods to `DashboardApi` or create a new API class

### Phase 3: Create the Spec File

1. Create `tests/nectar/UsecaseX.spec.ts`
2. Import required page objects and API classes
3. Structure with `test.describe` → `test.beforeEach` → `test` → `test.step`
4. Each manual step = one `test.step()` block

### Phase 4: Add Page Object Methods

For each new interaction:

```typescript
// In your page object class:
async newAction() {
  // 1. Scroll into view if needed
  await this.element.scrollIntoViewIfNeeded();
  
  // 2. Wait for visibility
  await expect(this.element).toBeVisible({ timeout: 10000 });
  
  // 3. Perform action
  await this.element.click();
  
  // 4. Wait for result (API response, element appearance, URL change)
  await this.page.waitForURL('**/expected-path**');
}
```

### Phase 5: Add API Validation (if needed)

1. Add endpoint method to `DashboardApi`:
   ```typescript
   async getNewData(): Promise<NewDataType | null> {
     const response = await this.apiContext.get(`${BASE_URL}/new/endpoint?${this.getCommonParams()}`);
     return response.ok() ? await response.json() : null;
   }
   ```

2. Add to `getAllDashboardData()` or call separately
3. Create verification method in the page object

### Phase 6: Handle Common Issues

| Issue | Solution |
|-------|----------|
| Element not clickable (behind overlay) | `scrollIntoViewIfNeeded()` + `click({ force: true })` |
| Accordion collapsed | Check `aria-expanded`, click header to expand |
| Dropdown option not visible | Use retry pattern with `expect().toPass()` |
| Data not loaded | `waitForResponse()` on the API call |
| Table row off-screen | Scroll each row in iteration loop |
| Flaky map marker click | Add `waitForTimeout(3000)` for marker stabilization |
| Stale element | Re-query the locator; use `nth()` instead of storing references |

---

## Existing Usecases Reference

### Usecase 1: Summary Corporate Locations with API Validation

**Flow:** Login → Historic Tab → Reset Filters → Summary Tab → Select Time Period → Click Map Location → Verify All Sections (Score, Pie, Insights, Bar Graph, Audio, Video, AppShare, Sessions) against API

**Key Features:** Full API-vs-UI comparison, cookie-based auth passthrough, parallel API calls, row-by-row session table validation

---

### Usecase 2: Call Historic Session Navigation

**Flow:** Login → Historic Tab → Reset Filters → Select Time Period → Filter Platform (MS Teams) → Filter Session Type (PSTN/External) → Open Sessions → Click Row → Session Page → Nectar Diagnostics → Related Call Details

**Key Features:** Multi-level navigation, filter combinations, double-click row navigation, session page hierarchy traversal

---

### Usecase 4: User Role Permissions (CRUD)

**Flow:** Login as Admin → Create Role → Create User with Role → Logout → Login as New User → Verify Permissions → Logout → Login as Admin → Delete User → Delete Role

**Key Features:** Full CRUD lifecycle, multi-user flow, permission verification, cleanup in same test

---

## Checklist for New Usecase

- [ ] Manual scenario documented (objective, preconditions, steps)
- [ ] Page objects identified (existing or new)
- [ ] Spec file created with proper structure
- [ ] `test.step()` blocks for each logical step
- [ ] `scrollIntoViewIfNeeded()` for below-fold elements
- [ ] Accordion expansion handled
- [ ] API responses waited on after actions
- [ ] Logger statements for data comparisons
- [ ] Cleanup in `afterEach` (dispose API contexts, etc.)
- [ ] Tested with `--headed` to verify visual flow
- [ ] Tested headless for CI compatibility
