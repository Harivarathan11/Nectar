import { expect, Locator, Page } from '@playwright/test';

import { AbstractPage } from './abstractPage';
import { DashboardApiResponse, QualityTypeData } from '../api/dashboardApi';
import { logger } from '../utils/logger';
import { SessionTypeMap } from '../enums/nectar/sessionType.enum';
import { SessionScenarioMap } from '../enums/nectar/sessionScenario.enum';
import { QualityTypeLabels } from '../enums/nectar/qualityType.enum';

type BarGraphDay = {
  startDate: string;
  endDate: string;
  sessions: { poor: number; good: number; unknown: number; average: number; all: number; avgNectarScore: number | null };
  zoneOffset: string;
};

export class CallDetailsPage extends AbstractPage {
  // --- Page root & header ---
  readonly callDetailsContainer = this.page.locator('section.global-filter');
  readonly selectedLocationFilter = this.page.locator('app-single-filter-with-selected-values').filter({ hasText: 'Corporate location:' });
  readonly selectedLocationFilterBadge = this.selectedLocationFilter.locator('.selected-options');
  readonly corporateLocationDropdownToggle = this.selectedLocationFilter.locator('button').first();
  readonly corporateLocationItem = (name: string) =>
    this.selectedLocationFilter.locator('li.list-group-item').filter({ hasText: name });
  readonly corporateLocationCheckedIcon = (name: string) =>
    this.corporateLocationItem(name).locator('svg use[href="#checked"]');

  // --- Nectar Score section ---
  readonly nectarScoreValue = this.page.locator('app-avg-nectar-score-card .highcharts-title');
  readonly nectarScoreChartSection = this.page.locator('app-avg-nectar-score-card app-pie-chart-component');
  readonly nectarScoreLegendNames = this.nectarScoreChartSection.locator('.legend-name');
  readonly nectarScoreLegendValues = this.nectarScoreChartSection.locator('.legend-value');

  // --- Pie chart (session summary) section ---
  readonly pieChartSection = this.page.locator('app-session-summary-card app-pie-chart-component');
  readonly totalSessionsCount = this.page.locator('app-session-summary-card .highcharts-title');
  readonly pieChartLegendNames = this.pieChartSection.locator('.legend-name');
  readonly pieChartLegendValues = this.pieChartSection.locator('.legend-value');

  // --- Audio quality accordion ---
  readonly audioAccordionTab = this.page.locator('p-accordion-panel').filter({ hasText: 'Audio' });

  // --- Video quality accordion ---
  readonly videoAccordionTab = this.page.locator('p-accordion-panel').filter({ hasText: 'Video' });
  readonly videoAccordionHeader = this.videoAccordionTab.locator('p-accordion-header');
  readonly videoAccordionFirstMetricValue = this.videoAccordionTab.locator('p-accordion-content .quality-item-value').first();

  // --- App Sharing quality accordion ---
  readonly appshareAccordionTab = this.page.locator('p-accordion-panel').filter({ hasText: 'App Sharing' });
  readonly appshareAccordionContent = this.appshareAccordionTab.locator('p-accordion-content');
  readonly appshareAccordionHeader = this.appshareAccordionTab.locator('p-accordion-header');
  readonly appshareMetricValues = this.appshareAccordionTab.locator('p-accordion-content .quality-item-value');

  // --- Insights section ---
  readonly insightsSection = this.page.locator('app-session-insights-card');
  readonly insightsBar = (cssClass: string) => this.insightsSection.locator(`.insights-bar-${cssClass}`);
  readonly insightsBarValue = (bar: Locator) => bar.locator('.insights-bar-value');

  // --- Sessions bar graph ---
  readonly barGraphSection = this.page.locator('app-extended-bar-chart');
  readonly barGraphTitle = this.barGraphSection.locator('.panel-title');
  readonly barGraphSubtitle = this.barGraphSection.locator('.panel-subtitle');
  readonly barGraphScoreChips = this.barGraphSection.locator('.highcharts-avgNectarScore-series text.series-chip-label');
  readonly barGraphMarkerPoints = this.barGraphSection.locator('g.highcharts-markers.highcharts-series-4 path.highcharts-point');
  readonly barGraphTooltipSvg = this.barGraphSection.locator('g.highcharts-tooltip');
  readonly barGraphTooltipDiv = this.barGraphSection.locator('div.highcharts-tooltip');

  // --- Call sessions list ---
  readonly sessionRows = this.page.locator('.wrap-quality-items');
  readonly sessionListPanel = this.page.locator('p-accordion-panel').filter({ hasText: 'CALL SESSIONS' });
  readonly sessionListContent = this.sessionListPanel.locator('p-accordion-content');
  readonly sessionListHeader = this.sessionListPanel.locator('p-accordion-header');
  readonly sessionGridRows = this.sessionListContent.locator('ag-grid-angular .ag-center-cols-container div[role="row"]');
  readonly sessionPaginationText = this.sessionListContent.locator('.showing-count');

  // --- Session row cell locators (accept a row locator as context) ---
  readonly sessionRowNectarScore = (row: Locator) => row.locator('[col-id="nectarScore"] .progress-bar__label span');
  readonly sessionRowStartDate = (row: Locator) => row.locator('[col-id="startDate"]');
  readonly sessionRowFrom = (row: Locator) => row.locator('[col-id="from"]');
  readonly sessionRowTo = (row: Locator) => row.locator('[col-id="to"]');
  readonly sessionRowDuration = (row: Locator) => row.locator('[col-id="duration"]');
  readonly sessionRowModality = (row: Locator) => row.locator('[col-id="modality"]');
  readonly sessionRowSessionScenario = (row: Locator) => row.locator('[col-id="sessionScenario"]');
  readonly sessionRowSessionType = (row: Locator) => row.locator('[col-id="sessionType"]');
  readonly sessionRowQuality = (row: Locator) => row.locator('[col-id="quality"]');

  // --- Private data ---
  private readonly audioVideoMetricNames = ['NUMBER_OF_STREAMS', 'AVG_JITTER', 'AVG_ROUND_TRIP_DELAY', 'AVG_PACKET_LOSS_PERCENTAGE', 'AVG_NECTAR_SCORE'];

  constructor(page: Page) {
    super(page);
  }

  /** Round a number to 1 decimal place to match UI display (trims trailing .0) */
  private roundToUI(value: number): string {
    const rounded = value.toFixed(1);
    return rounded.endsWith('.0') ? String(Math.round(value)) : rounded;
  }

  /** Format seconds as HH:MM:SS */
  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  /** Format a UTC API date string to UI format "hh:mm AM/PM, MM/DD/YYYY" in local timezone */
  private formatApiDate(raw: string | number | null): string {
    if (!raw) return '';
    const str = typeof raw === 'string' ? raw : String(raw);
    const utcStr = /Z|[+-]\d{2}:\d{2}$/.test(str) ? str : str + 'Z';
    const d = new Date(utcStr);
    const hours = d.getHours();
    const h12 = (hours % 12 || 12).toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${h12}:${minutes} ${ampm}, ${month}/${day}/${d.getFullYear()}`;
  }

  /** Build a name→value map from two parallel legend locators */
  private async buildLegendMap(namesLocator: Locator, valuesLocator: Locator): Promise<Record<string, string>> {
    const names = await namesLocator.allTextContents();
    const values = await valuesLocator.allTextContents();
    return Object.fromEntries(names.map((n, i) => [n.trim(), values[i].trim()]));
  }

  /** Get the quality section locator by its section title within an accordion content area */
  private getQualitySection(accordionTab: Locator, sectionTitle: string): Locator {
    return accordionTab.locator('p-accordion-content .wrap-quality-items').filter({ has: this.page.locator(`.section-title`, { hasText: sectionTitle }) });
  }

  /** Get all .quality-item-value elements within a section in order */
  private getMetricValues(section: Locator): Locator {
    return section.locator('.quality-item-value');
  }

  /** Get metric value from API data for a specific quality type and metric name */
  private getMetricValue(data: QualityTypeData[], qualityType: string, metricName: string): number | null {
    const typeData = data.find((q) => q.qualityType === qualityType);
    if (!typeData) return null;
    const metric = typeData.qualityMetrics.find((m) => m.name === metricName);
    return metric?.value ?? null;
  }

  async verifyCallDetailsPageOpened() {
    await expect(this.selectedLocationFilter).toBeVisible({ timeout: 30000 });
  }

  async verifySelectedLocationFilter(locationName: string) {
    await expect(this.selectedLocationFilter).toBeVisible();
    await expect(this.selectedLocationFilterBadge).toContainText('1 selected');
    // Open the Corporate location dropdown
    await this.corporateLocationDropdownToggle.click();
    // Verify the clicked location's checkbox is checked
    const item = this.corporateLocationItem(locationName);
    await expect(item).toBeVisible();
    await expect(this.corporateLocationCheckedIcon(locationName)).toBeVisible();
    await this.corporateLocationDropdownToggle.click();
  }

  async getNectarScoreFromUI(): Promise<string> {
    return (await this.nectarScoreValue.textContent()) || '';
  }

  async getTotalSessionsFromUI(): Promise<string> {
    return ((await this.totalSessionsCount.textContent()) || '').trim();
  }

  async getSessionRowCount(): Promise<number> {
    return await this.sessionRows.count();
  }

  async verifyNectarScoreWithApi(apiData: DashboardApiResponse) {
    await expect(this.nectarScoreValue).toBeVisible();
    if (!apiData.nectarScore) return;

    const uiNectarScore = await this.getNectarScoreFromUI();
    const expectedScore = String(apiData.nectarScore.summary.avgNectarScore ?? 'N/A');
    logger(`[Compare] Nectar Score - UI: "${uiNectarScore}", API: "${expectedScore}"`);
    expect(uiNectarScore).toContain(expectedScore);

    const GROUP_LABEL: Record<string, string> = { CRITICAL: 'Poor', AVERAGE: 'Average', GOOD: 'Good', UNKNOWN: 'Unknown' };
    const legendMap = await this.buildLegendMap(this.nectarScoreLegendNames, this.nectarScoreLegendValues);

    for (const { group, percentage } of apiData.nectarScore.groups) {
      const expected = percentage === 0 ? '0' : `${percentage.toFixed(2)}%`;
      logger(`[Compare] Nectar Score legend "${GROUP_LABEL[group]}" - UI: "${legendMap[GROUP_LABEL[group]]}", API: "${expected}"`);
      expect(legendMap[GROUP_LABEL[group]]).toBe(expected);
    }
  }

  async verifyPieChartWithApi(apiData: DashboardApiResponse) {
    await expect(this.pieChartSection).toBeVisible();
    if (!apiData.sessionSummary) return;

    expect(await this.getTotalSessionsFromUI()).toContain(String(apiData.sessionSummary.summary.totalCount));

    const GROUP_LABEL: Record<string, string> = { APP_SHARING: 'App Sharing', AUDIO: 'Audio', VIDEO: 'Video', UNKNOWN: 'Unknown', CONVERSATION: 'Conversations' };
    const legendMap = await this.buildLegendMap(this.pieChartLegendNames, this.pieChartLegendValues);

    for (const { group, percentage } of apiData.sessionSummary.groups) {
      const expected = percentage === 0 ? '0' : `${percentage.toFixed(2)}%`;
      logger(`[Compare] Pie "${GROUP_LABEL[group]}" - UI: "${legendMap[GROUP_LABEL[group]]}", API: "${expected}"`);
      expect(legendMap[GROUP_LABEL[group]]).toBe(expected);
    }
  }

  /** Verify a single quality section (Peer To Peer, PSTN, etc.) within an accordion tab */
  private async verifyQualitySection(
    accordionTab: Locator,
    qualityType: string,
    apiData: QualityTypeData[],
    metricNames: string[],
  ) {
    const sectionTitle = QualityTypeLabels[qualityType];
    const section = this.getQualitySection(accordionTab, sectionTitle);
    const values = this.getMetricValues(section);
    const valueCount = await values.count();

    // Get API values in the same order as UI displays them
    for (let i = 0; i < metricNames.length && i < valueCount; i++) {
      const apiValue = this.getMetricValue(apiData, qualityType, metricNames[i]);
      const uiValue = (await values.nth(i).textContent()) || '';

      if (apiValue === null) {
        // Null in API means 0 or N/A in UI
        logger(`[Compare]   ${metricNames[i]}: UI="${uiValue}", API=null (expect 0 or N/A)`);
        expect(uiValue === '0' || uiValue === 'N/A').toBeTruthy();
      } else {
        const expected = metricNames[i] === 'NUMBER_OF_STREAMS'
          ? String(apiValue)
          : this.roundToUI(apiValue);
        logger(`[Compare]   ${metricNames[i]}: UI="${uiValue}", API="${expected}"`);
        expect(uiValue).toBe(expected);
      }
    }
  }

  async verifyAudioQualityWithApi(apiData: DashboardApiResponse) {
    await expect(this.audioAccordionTab).toBeVisible();
    if (!apiData.audioQuality || apiData.audioQuality.length === 0) return;

    logger('[Compare] === Audio ===');

    for (const type of ['PEER2PEER', 'PSTN', 'CONFERENCE', 'WEBINAR']) {
      await this.verifyQualitySection(this.audioAccordionTab, type, apiData.audioQuality, this.audioVideoMetricNames);
    }
  }

  async verifyVideoQualityWithApi(apiData: DashboardApiResponse) {
    await expect(this.videoAccordionTab).toBeVisible();
    if (!apiData.videoQuality || apiData.videoQuality.length === 0) return;

    // Scroll into view and ensure the Video accordion content is visible
    await this.videoAccordionTab.scrollIntoViewIfNeeded();
    logger('[Compare] === Video ===');
    if (!(await this.videoAccordionFirstMetricValue.isVisible())) {
      await this.videoAccordionHeader.click();
      await this.page.waitForTimeout(500);
    }

    for (const type of ['PEER2PEER', 'CONFERENCE', 'WEBINAR']) {
      await this.verifyQualitySection(this.videoAccordionTab, type, apiData.videoQuality, this.audioVideoMetricNames);
    }
  }

  async verifyAppshareQualityWithApi(apiData: DashboardApiResponse) {
    await expect(this.appshareAccordionTab).toBeVisible();
    if (!apiData.appshareQuality || apiData.appshareQuality.length === 0) return;

    // Scroll into view and ensure the App Sharing accordion content is visible
    await this.appshareAccordionTab.scrollIntoViewIfNeeded();
    logger('[Compare] === App Sharing ===');
    if (!(await this.appshareMetricValues.first().isVisible())) {
      await this.appshareAccordionHeader.click();
      await this.page.waitForTimeout(500);
    }

    // Appshare only has: NUMBER_OF_STREAMS, AVG_JITTER, AVG_NECTAR_SCORE
    const metricNames = ['NUMBER_OF_STREAMS', 'AVG_JITTER', 'AVG_NECTAR_SCORE'];
    const qualityData = apiData.appshareQuality[0];
    if (!qualityData) return;

    // Appshare has no qualityType subsections, just one flat section
    const valueCount = await this.appshareMetricValues.count();

    for (let i = 0; i < metricNames.length && i < valueCount; i++) {
      const metric = qualityData.qualityMetrics.find((m) => m.name === metricNames[i]);
      const apiValue = metric?.value ?? null;
      const uiValue = (await this.appshareMetricValues.nth(i).textContent()) || '';

      if (apiValue === null) {
        logger(`[Compare]   ${metricNames[i]}: UI="${uiValue}", API=null (expect 0 or N/A)`);
        expect(uiValue === '0' || uiValue === 'N/A').toBeTruthy();
      } else {
        const expected = metricNames[i] === 'NUMBER_OF_STREAMS'
          ? String(apiValue)
          : this.roundToUI(apiValue);
        logger(`[Compare]   ${metricNames[i]}: UI="${uiValue}", API="${expected}"`);
        expect(uiValue).toBe(expected);
      }
    }
  }

  async verifySessionRowsWithApi(apiData: DashboardApiResponse) {
    if (!apiData.sessions || apiData.sessions.elements.length === 0) return;

    logger('[Compare] === Call Sessions ===');

    await this.sessionListPanel.scrollIntoViewIfNeeded();
    await expect(this.sessionListPanel).toBeVisible({ timeout: 10000 });
    const isExpanded = await this.sessionListHeader.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.sessionListHeader.click();
      await this.page.waitForTimeout(500);
    }

    // Wait for rows to appear
    await this.sessionGridRows.first().waitFor({ state: 'visible', timeout: 10000 });
    const uiRowCount = await this.sessionGridRows.count();
    const apiElements = apiData.sessions.elements;
    const pageSize = Math.min(uiRowCount, apiElements.length);

    logger(`[Compare] API totalElements: ${apiData.sessions.totalElements}, page elements: ${apiElements.length}`);
    logger(`[Compare] UI rows: ${uiRowCount}, API page elements: ${apiElements.length}`);

    // Compare row by row
    for (let i = 0; i < pageSize; i++) {
      const row = this.sessionGridRows.nth(i);
      const apiRow = apiElements[i];

      // Scroll row into view so it's visible in headed mode
      await row.scrollIntoViewIfNeeded();

      // Get UI cell values using col-id
      const uiNectarScore = await this.sessionRowNectarScore(row).textContent() || '';
      const uiStartDate = await this.sessionRowStartDate(row).textContent() || '';
      const uiFrom = await this.sessionRowFrom(row).textContent() || '';
      const uiTo = await this.sessionRowTo(row).textContent() || '';
      const uiDuration = await this.sessionRowDuration(row).textContent() || '';
      const uiModality = await this.sessionRowModality(row).textContent() || '';
      const uiSessionScenario = await this.sessionRowSessionScenario(row).textContent() || '';
      const uiSessionType = await this.sessionRowSessionType(row).textContent() || '';
      
      // Get API values
      const rawNectarScore = apiRow['nectarScore'] as number | null;
      const apiNectarScore = rawNectarScore != null ? `${Math.round(rawNectarScore)}%` : 'N/A';
      const apiFrom = (apiRow['from'] as string) || 'N/A';
      const apiTo = (apiRow['to'] as string) || 'N/A';
      const apiDuration = this.formatDuration(Number(apiRow['duration']) || 0);
      const apiModality = apiRow['modality'] as string || '';
      const apiSessionScenario = SessionScenarioMap[(apiRow['sessionScenario'] as string)] || (apiRow['sessionScenario'] as string) || '';
      const apiSessionType = SessionTypeMap[(apiRow['sessionType'] as string)] || (apiRow['sessionType'] as string) || '';
      const apiStartDate = this.formatApiDate(apiRow['startDate'] as string | number | null);

      logger(`[Compare] Row ${i + 1}:`);
      logger(`[Compare]   Nectar Score: UI="${uiNectarScore.trim()}", API="${apiNectarScore}"`);
      logger(`[Compare]   Start Time: UI="${uiStartDate.trim()}", API="${apiStartDate}"`);
      logger(`[Compare]   From: UI="${uiFrom.trim()}", API="${apiFrom}"`);
      logger(`[Compare]   To: UI="${uiTo.trim()}", API="${apiTo}"`);
      logger(`[Compare]   Duration: UI="${uiDuration.trim()}", API="${apiDuration}"`);
      logger(`[Compare]   Modality: UI="${uiModality.trim()}", API="${apiModality}"`);
      logger(`[Compare]   Session Scenario: UI="${uiSessionScenario.trim()}", API="${apiSessionScenario}"`);
      logger(`[Compare]   Session Type: UI="${uiSessionType.trim()}", API="${apiSessionType}"`);

      if (rawNectarScore != null) {
        expect(uiNectarScore.trim()).toBe(apiNectarScore);
      }
      if (apiStartDate) {
        expect(uiStartDate.trim()).toBe(apiStartDate);
      }
      expect(uiFrom.trim()).toBe(apiFrom);
      expect(uiTo.trim()).toBe(apiTo);
      expect(uiDuration.trim()).toBe(apiDuration);
      expect(uiModality.trim()).toBe(apiModality);
      expect(uiSessionScenario.trim()).toBe(apiSessionScenario);
      if (apiSessionType) {
        expect(uiSessionType.trim()).toBe(apiSessionType);
      }
    }

    // Verify total elements via pagination text
    const showingText = await this.sessionPaginationText.textContent() || '';
    logger(`[Compare] Pagination: "${showingText.trim()}", API totalElements: ${apiData.sessions.totalElements}`);
    expect(showingText).toContain(String(apiData.sessions.totalElements));
  }

  async verifyInsightsWithApi(apiData: DashboardApiResponse) {
    await expect(this.insightsSection).toBeVisible();
    if (!apiData.insights) return;

    logger('[Compare] === Insights ===');

    // API returns: [{"insight":"HIGH_JITTER","count":0,"percent":0,"totalSessions":46}, ...]
    // Map CSS class suffix to API insight key
    const insightBarMap: { cssClass: string; label: string; apiKey: string }[] = [
      { cssClass: 'high_jitter', label: 'High Jitter', apiKey: 'HIGH_JITTER' },
      { cssClass: 'high_packet_loss', label: 'High Packet Loss', apiKey: 'HIGH_PACKET_LOSS' },
      { cssClass: 'high_roundtrip_delay', label: 'High Roundtrip Delay', apiKey: 'HIGH_ROUNDTRIP_DELAY' },
      { cssClass: 'agent', label: 'Sessions with Agents', apiKey: 'AGENT' },
      { cssClass: 'acd', label: 'ACD', apiKey: 'ACD' },
      { cssClass: 'ivr', label: 'IVR', apiKey: 'IVR' },
      { cssClass: 'customer', label: 'Customer', apiKey: 'CUSTOMER' },
    ];

    const insightsArray = apiData.insights as unknown as Array<{ insight: string; count: number; percent: number; totalSessions: number }>;

    for (const insight of insightBarMap) {
      const bar = this.insightsBar(insight.cssClass);
      const barCount = await bar.count();
      if (barCount === 0) {
        logger(`[Compare]   ${insight.label}: NOT FOUND in UI`);
        continue;
      }
      const uiValue = await this.insightsBarValue(bar).textContent() || '';

      // Find matching API entry by insight key
      const apiEntry = insightsArray.find((item) => item.insight === insight.apiKey);
      const apiValue = apiEntry ? `${apiEntry.percent ?? 0}%` : 'N/A';

      logger(`[Compare]   ${insight.label}: UI="${uiValue.trim()}", API="${apiValue}"`);
      expect(uiValue.trim()).toBe(apiValue);
    }
  }

  async verifyBarGraphWithApi(apiData: DashboardApiResponse) {
    await expect(this.barGraphSection).toBeVisible();
    if (!apiData.barGraph) return;

    logger('[Compare] === Sessions Bar Graph ===');
    logger(`[Compare]   Chart Title: "${(await this.barGraphTitle.textContent() || '').trim()}"`);
    logger(`[Compare]   Time Period: "${(await this.barGraphSubtitle.textContent() || '').trim()}"`);

    const barDataArray = apiData.barGraph as unknown as BarGraphDay[];
    const daysWithScore = barDataArray.filter((d) => d.sessions.avgNectarScore !== null);

    await this.verifyScoreChips(daysWithScore);
    await this.verifyDailyBreakdown(daysWithScore);

    const totalSessionsFromBar = barDataArray.reduce((sum, d) => sum + d.sessions.all, 0);
    if (apiData.nectarScore) {
      logger(`[Compare]   Total sessions: barGraph=${totalSessionsFromBar}, nectarScore=${apiData.nectarScore.summary.totalCount}`);
      expect(totalSessionsFromBar).toBe(apiData.nectarScore.summary.totalCount);
    }
  }

  private async verifyScoreChips(daysWithScore: BarGraphDay[]) {
    const apiScoreValues = daysWithScore.map((d) => `${Math.round(d.sessions.avgNectarScore ?? 0)}%`);
    const chipValues = (await this.barGraphScoreChips.allTextContents()).map(v => v.trim());

    logger(`[Compare]   Avg Nectar Score (${chipValues.length}): UI=[${chipValues.join(', ')}] API=[${apiScoreValues.join(', ')}]`);
    expect(chipValues.length).toBe(apiScoreValues.length);
    chipValues.forEach((chip, i) => expect(chip).toBe(apiScoreValues[i]));
  }

  /** Hover a bar marker and return the tooltip text, or empty string if not visible */
  private async getTooltipText(marker: Locator): Promise<string> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const box = await marker.boundingBox();
      if (box) {
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        await marker.hover({ force: true });
      }
      await this.page.waitForTimeout(400);
      const text = (
        await this.barGraphTooltipSvg.textContent({ timeout: 2000 }).catch(() => '') ||
        await this.barGraphTooltipDiv.textContent({ timeout: 2000 }).catch(() => '')
      )?.trim() ?? '';
      if (text) return text;
    }
    return '';
  }

  /** Match a tooltip ISO date string against the correct API day using zoneOffset */
  private matchApiDay(tooltipIsoDate: string, daysWithScore: BarGraphDay[], fallback: BarGraphDay): BarGraphDay {
    const matched = daysWithScore.find((d) => {
      const offsetMatch = d.zoneOffset?.match(/([+-])(\d{2}):(\d{2})/);
      if (!offsetMatch) return d.startDate.startsWith(tooltipIsoDate);
      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const offsetMs = sign * (parseInt(offsetMatch[2]) * 60 + parseInt(offsetMatch[3])) * 60000;
      const localDate = new Date(new Date(d.startDate + 'Z').getTime() + offsetMs);
      const localIso = `${localDate.getUTCFullYear()}-${String(localDate.getUTCMonth() + 1).padStart(2, '0')}-${String(localDate.getUTCDate()).padStart(2, '0')}`;
      return localIso === tooltipIsoDate;
    });
    return matched ?? fallback;
  }

  private async verifyDailyBreakdown(daysWithScore: BarGraphDay[]) {
    logger(`[Compare]   Daily session breakdown (via tooltip hover):`);
    const pointsToHover = Math.min(await this.barGraphMarkerPoints.count(), daysWithScore.length);

    for (let i = 0; i < pointsToHover; i++) {
      const marker = this.barGraphMarkerPoints.nth(i);
      await marker.scrollIntoViewIfNeeded();

      const tooltipText = await this.getTooltipText(marker);
      if (!tooltipText) {
        logger(`[Compare] Day ${i + 1}: Tooltip NOT visible after hover`);
        continue;
      }

      const normalized = tooltipText.replace(/\s+/g, ' ').trim();
      const extract = (pattern: RegExp) => { const m = normalized.match(pattern); return m ? Number(m[1]) : null; };
      const uiGood = extract(/good\s+(\d+)/i);
      const uiAvg = extract(/average\s+(\d+)/i);
      const uiPoor = extract(/poor\s+(\d+)/i);
      const uiUnknown = extract(/unknown\s+(\d+)/i);
      const uiTotal = extract(/Total Sessions:\s*(\d+)/i);

      const tooltipDateMatch = normalized.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
      let apiDay = daysWithScore[i];
      if (tooltipDateMatch) {
        const [month, day, year] = tooltipDateMatch[1].split('/');
        apiDay = this.matchApiDay(`${year}-${month}-${day}`, daysWithScore, apiDay);
      }

      logger(`[Compare] Day ${i + 1}: UI=[Good=${uiGood}, Avg=${uiAvg}, Poor=${uiPoor}, Unknown=${uiUnknown}, Total=${uiTotal}] API=[Good=${apiDay.sessions.good}, Avg=${apiDay.sessions.average}, Poor=${apiDay.sessions.poor}, Unknown=${apiDay.sessions.unknown}, Total=${apiDay.sessions.all}]`);

      expect(uiGood).toBe(apiDay.sessions.good);
      expect(uiAvg).toBe(apiDay.sessions.average);
      expect(uiPoor).toBe(apiDay.sessions.poor);
      expect(uiUnknown).toBe(apiDay.sessions.unknown);
      expect(uiTotal).toBe(apiDay.sessions.all);
    }
  }
}
