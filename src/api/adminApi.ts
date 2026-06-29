import { APIRequestContext, request } from '@playwright/test';

import { logger } from '../utils/logger';

const ADMIN_BASE_URL = process.env.NECTAR_ADMIN_API_BASE_URL;
const TENANT = process.env.NECTAR_TENANT;

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  [key: string]: unknown;
}

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  totalPages: number;
  totalElements: number;
  elements: T[];
  pageNumber: number;
  pageSize: number;
}

/**
 * Admin API client for checking if users/roles exist.
 * Used in test setup to determine if cleanup is needed before test execution.
 */
export class AdminApi {
  private apiContext: APIRequestContext | null = null;

  async initialize(cookies: { name: string; value: string }[]) {
    const xsrfToken = cookies.find((c) => c.name === 'XSRF-TOKEN')?.value || '';
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    this.apiContext = await request.newContext({
      extraHTTPHeaders: {
        'Cookie': cookieHeader,
        'x-xsrf-token': xsrfToken,
      },
    });
  }

  /**
   * Check if a user exists by searching with a query string.
   * Returns true if at least one matching user is found.
   */
  async userExists(searchQuery: string): Promise<boolean> {
    if (!this.apiContext) throw new Error('AdminApi not initialized');

    const url = `${ADMIN_BASE_URL}/users?tenant=${TENANT}`;
    const response = await this.apiContext.post(url, {
      form: {
        pageSize: '10',
        pageNumber: '1',
        orderByField: 'lastName',
        orderDirection: 'asc',
        searchQuery,
      },
    });

    if (response.ok()) {
      const data = await response.json() as PaginatedResponse<AdminUser>;
      logger(`[AdminApi] searchUsers("${searchQuery}"): found ${data.totalElements} result(s)`);
      return data.totalElements > 0;
    }
    logger(`[AdminApi] searchUsers failed: ${response.status()}`);
    return false;
  }

  /**
   * Check if a role exists by searching with a query string.
   * Does an exact name match against API results since search is fuzzy.
   * Returns true if the exact role name is found.
   */
  async roleExists(roleName: string): Promise<boolean> {
    if (!this.apiContext) throw new Error('AdminApi not initialized');

    const params = new URLSearchParams({
      pageSize: '10',
      pageNumber: '1',
      searchQuery: roleName,
      tenant: TENANT,
    });
    const url = `${ADMIN_BASE_URL}/user/roles?${params.toString()}`;
    const response = await this.apiContext.get(url);

    if (response.ok()) {
      const data = await response.json() as PaginatedResponse<AdminRole>;
      const exactMatch = data.elements.some((role) => role.name === roleName);
      logger(`[AdminApi] searchRoles("${roleName}"): found ${data.totalElements} result(s)`);
      return exactMatch;
    }
    logger(`[AdminApi] searchRoles failed: ${response.status()}`);
    return false;
  }

  async dispose() {
    if (this.apiContext) {
      await this.apiContext.dispose();
      this.apiContext = null;
    }
  }
}
