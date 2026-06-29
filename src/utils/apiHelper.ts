import { APIRequestContext, request } from '@playwright/test';

import { logger } from './logger';

const BASE_URL = process.env.NECTAR_API_BASE_URL ?? 'https://release.lab1.test.nectarvoip.com/dashboardapi';
const TENANT = process.env.NECTAR_TENANT ?? 'nectarcorp';

export interface ApiHelperOptions {
  tenant?: string;
  baseUrl?: string;
}

/**
 * Reusable API helper utility for making authenticated API calls.
 * Initialize with browser cookies and use across multiple usecases.
 */
export class ApiHelper {
  private apiContext: APIRequestContext | null = null;
  private readonly baseUrl: string;
  private readonly tenant: string;

  constructor(options?: ApiHelperOptions) {
    this.baseUrl = options?.baseUrl ?? BASE_URL;
    this.tenant = options?.tenant ?? TENANT;
  }

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

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const urlParams = new URLSearchParams({
      tenant: this.tenant,
      ...params,
    });
    return `${this.baseUrl}/${endpoint}?${urlParams.toString()}`;
  }

  /**
   * Generic GET request with authentication
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
    if (!this.apiContext) throw new Error('API context not initialized. Call initialize() first.');

    const url = this.buildUrl(endpoint, params);
    logger(`[ApiHelper] GET ${url}`);
    const response = await this.apiContext.get(url);

    if (response.ok()) {
      return await response.json() as T;
    }
    const body = await response.text();
    logger(`[ApiHelper] GET failed: ${response.status()}, Body: ${body}`);
    return null;
  }

  /**
   * Generic POST request with authentication
   */
  async post<T>(endpoint: string, data?: unknown, params?: Record<string, string>): Promise<T | null> {
    if (!this.apiContext) throw new Error('API context not initialized. Call initialize() first.');

    const url = this.buildUrl(endpoint, params);
    logger(`[ApiHelper] POST ${url}`);
    const response = await this.apiContext.post(url, { data });

    if (response.ok()) {
      return await response.json() as T;
    }
    const body = await response.text();
    logger(`[ApiHelper] POST failed: ${response.status()}, Body: ${body}`);
    return null;
  }

  /**
   * Fetch sessions with filters (reusable across usecases)
   */
  async getSessions(additionalParams?: Record<string, string>): Promise<SessionListResponse | null> {
    const params: Record<string, string> = {
      pageNumber: '1',
      pageSize: '10',
      orderDirection: 'desc',
      orderByField: 'startDate',
      ...additionalParams,
    };
    return this.get<SessionListResponse>('session', params);
  }

  /**
   * Fetch session details by session ID
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetailResponse | null> {
    return this.get<SessionDetailResponse>(`session/${sessionId}`);
  }

  /**
   * Fetch Nectar Diagnostics data for a session
   */
  async getNectarDiagnostics(sessionId: string): Promise<NectarDiagnosticsResponse | null> {
    return this.get<NectarDiagnosticsResponse>(`session/${sessionId}/diagnostics`);
  }

  /**
   * Fetch related call details for a session
   */
  async getRelatedCallDetails(sessionId: string): Promise<RelatedCallDetailsResponse | null> {
    return this.get<RelatedCallDetailsResponse>(`session/${sessionId}/related`);
  }

  async dispose() {
    if (this.apiContext) {
      await this.apiContext.dispose();
      this.apiContext = null;
    }
  }
}

// --- Response interfaces ---

export interface SessionListResponse {
  totalPages: number;
  totalElements: number;
  elements: Array<Record<string, unknown>>;
  pageNumber: number;
  pageSize: number;
}

export interface SessionDetailResponse {
  sessionId: string;
  from: string;
  to: string;
  startDate: string;
  duration: number;
  modality: string;
  sessionType: string;
  sessionScenario: string;
  nectarScore: number | null;
  platform: string;
  [key: string]: unknown;
}

export interface NectarDiagnosticsResponse {
  elements: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface RelatedCallDetailsResponse {
  elements: Array<Record<string, unknown>>;
  [key: string]: unknown;
}
