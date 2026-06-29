import { APIRequestContext, request } from '@playwright/test';

import { logger } from '../utils/logger';

const BASE_URL = process.env.NECTAR_API_BASE_URL ?? 'https://release.lab1.test.nectarvoip.com/dashboardapi';
const TENANT = process.env.NECTAR_TENANT ?? 'nectarcorp';

export interface PinnedUserElement {
  displayName: string;
  email: string;
  location: string;
  sessionCount: number;
  sessionPoor: number;
  nectarScore: number | null;
  nectarScoreAvg: number | null;
  lastSessionDate: string | null;
  [key: string]: unknown;
}

export interface PinnedUsersResponse {
  totalPages: number;
  totalElements: number;
  elements: PinnedUserElement[];
  pageNumber: number;
  pageSize: number;
}

export interface UserDetailData {
  [key: string]: unknown;
}

/**
 * User API client for fetching pinned users and user details.
 * Reusable across multiple usecases (Usecase3, Usecase5, Usecase6).
 */
export class UserApi {
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

  /**
   * Get pinned users list
   * API: GET /dashboardapi/user/pinned?pageSize=10&pageNumber=1&orderByField=displayName&orderDirection=asc&tenant=nectarcorp
   */
  async getPinnedUsers(
    pageNumber = 1,
    pageSize = 10,
    orderDirection = 'asc',
    orderByField = 'displayName',
  ): Promise<PinnedUsersResponse | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const params = this.getCommonParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
      orderDirection,
      orderByField,
    });

    const url = `${BASE_URL}/user/pinned?${params}`;
    logger(`[UserApi] GET ${url}`);
    const response = await this.apiContext.get(url);

    if (response.ok()) {
      return await response.json();
    }
    logger(`[UserApi] Failed to get pinned users: ${response.status()}`);
    return null;
  }

  /**
   * Get individual user details by user ID
   * API: GET /dashboardapi/user/{userId}
   */
  async getUserDetails(userId: string): Promise<UserDetailData | null> {
    if (!this.apiContext) throw new Error('API context not initialized');

    const url = `${BASE_URL}/user/${userId}?${this.getCommonParams()}`;
    logger(`[UserApi] GET ${url}`);
    const response = await this.apiContext.get(url);

    if (response.ok()) {
      return await response.json();
    }
    logger(`[UserApi] Failed to get user details for ID ${userId}: ${response.status()}`);
    return null;
  }

  async dispose() {
    if (this.apiContext) {
      await this.apiContext.dispose();
      this.apiContext = null;
    }
  }
}
