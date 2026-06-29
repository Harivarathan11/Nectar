import { APIRequestContext, request } from '@playwright/test';

import { logger } from '../utils/logger';

const BASE_URL = process.env.NECTAR_API_BASE_URL ?? 'https://release.lab1.test.nectarvoip.com/dashboardapi';
const TENANT = process.env.NECTAR_TENANT ?? 'nectarcorp';

export interface SessionSummaryData {
  summary: { totalCount: number; avgNectarScore: number | null; conversationJourneyCount: number | null };
  groups: Array<{ group: string; count: number; percentage: number }>;
  [key: string]: unknown;
}

export interface NectarScoreData {
  summary: {
    totalCount: number;
    avgNectarScore: number;
    conversationJourneyCount: number | null;
  };
  groups: Array<{
    group: string;
    count: number;
    percentage: number;
  }>;
  [key: string]: unknown;
}

export interface InsightsData {
  [key: string]: unknown;
}

export interface BarGraphData {
  [key: string]: unknown;
}

export interface QualityMetric {
  name: string;
  value: number | null;
}

export interface QualityTypeData {
  qualityType: string | null;
  qualityMetrics: QualityMetric[];
}

export type QualitySessionData = QualityTypeData[];

export interface SessionListData {
  totalPages: number;
  totalElements: number;
  elements: Array<Record<string, unknown>>;
  pageNumber: number;
  pageSize: number;
}

export interface DashboardApiResponse {
  sessionSummary: SessionSummaryData | null;
  nectarScore: NectarScoreData | null;
  insights: InsightsData | null;
  barGraph: BarGraphData | null;
  audioQuality: QualitySessionData | null;
  videoQuality: QualitySessionData | null;
  appshareQuality: QualitySessionData | null;
  sessions: SessionListData | null;
}

export class DashboardApi {
  private apiContext: APIRequestContext | null = null;

  async initialize(cookies: { name: string; value: string }[]) {
    const xsrfToken = cookies.find((c) => c.name === 'XSRF-TOKEN')?.value || '';
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    this.apiContext = await request.newContext({
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'x-xsrf-token': xsrfToken,
      },
    });
  }

  private getCommonParams(additionalParams?: Record<string, string>): string {
    const params = new URLSearchParams({
      tenant: TENANT,
      ...additionalParams,
    });
    return params.toString();
  }

  async getSessionSummary(): Promise<SessionSummaryData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const url = `${BASE_URL}/session/summary?${this.getCommonParams()}`;
    const response = await this.apiContext.get(url);

    if (response.ok()) {
      return await response.json();
    }
    const body = await response.text();
    logger(`[DashboardApi] Failed to get session summary: ${response.status()}, Body: ${body}`);
    return null;
  }

  async getNectarScore(): Promise<NectarScoreData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const url = `${BASE_URL}/session/summary/nectarscore?${this.getCommonParams()}`;
    const response = await this.apiContext.get(url);

    if (response.ok()) {
      return await response.json();
    }
    const body = await response.text();
    logger(`[DashboardApi] Failed to get nectar score: ${response.status()}, Body: ${body}`);
    return null;
  }

  async getInsights(): Promise<InsightsData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const response = await this.apiContext.get(
      `${BASE_URL}/session/summary/insights?${this.getCommonParams()}`,
    );

    if (response.ok()) {
      return await response.json();
    }
    logger(`Failed to get insights: ${response.status()}`);
    return null;
  }

  async getNectarScoreBarGraph(): Promise<BarGraphData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const response = await this.apiContext.get(
      `${BASE_URL}/quality/nectarscore/bar/graph?${this.getCommonParams()}`,
    );

    if (response.ok()) {
      return await response.json();
    }
    logger(`Failed to get bar graph: ${response.status()}`);
    return null;
  }

  async getAudioQuality(): Promise<QualitySessionData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const response = await this.apiContext.get(
      `${BASE_URL}/quality/session/audio?${this.getCommonParams()}`,
    );

    if (response.ok()) {
      return await response.json();
    }
    logger(`Failed to get audio quality: ${response.status()}`);
    return null;
  }

  async getVideoQuality(): Promise<QualitySessionData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const response = await this.apiContext.get(
      `${BASE_URL}/quality/session/video?${this.getCommonParams()}`,
    );

    if (response.ok()) {
      return await response.json();
    }
    logger(`Failed to get video quality: ${response.status()}`);
    return null;
  }

  async getAppshareQuality(): Promise<QualitySessionData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const response = await this.apiContext.get(
      `${BASE_URL}/quality/session/appshare?${this.getCommonParams()}`,
    );

    if (response.ok()) {
      return await response.json();
    }
    logger(`Failed to get appshare quality: ${response.status()}`);
    return null;
  }

  async getSessions(
    pageNumber = 1,
    pageSize = 10,
    orderDirection = 'desc',
    orderByField = 'startDate',
  ): Promise<SessionListData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const params = this.getCommonParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
      orderDirection,
      orderByField,
    });

    const response = await this.apiContext.get(`${BASE_URL}/session?${params}`);

    if (response.ok()) {
      return await response.json();
    }
    logger(`Failed to get sessions: ${response.status()}`);
    return null;
  }

  async getAllDashboardData(): Promise<DashboardApiResponse> {
    const [
      sessionSummary,
      nectarScore,
      insights,
      barGraph,
      audioQuality,
      videoQuality,
      appshareQuality,
      sessions,
    ] = await Promise.all([
      this.getSessionSummary(),
      this.getNectarScore(),
      this.getInsights(),
      this.getNectarScoreBarGraph(),
      this.getAudioQuality(),
      this.getVideoQuality(),
      this.getAppshareQuality(),
      this.getSessions(),
    ]);

    return {
      sessionSummary,
      nectarScore,
      insights,
      barGraph,
      audioQuality,
      videoQuality,
      appshareQuality,
      sessions,
    };
  }

  async dispose() {
    if (this.apiContext) {
      await this.apiContext.dispose();
    }
  }
}
