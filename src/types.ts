export type ApiEnvironment = "production" | "development";

export type TrucklineClientOptions = {
  /**
   * Public API key (`tlmp_api_...`) from the developer console.
   * Optional for purely anonymous endpoints (stricter rate limits).
   */
  apiKey?: string;
  /**
   * Override base URL. Defaults by `environment`.
   * Examples:
   * - https://api.trucklinemp.com
   * - https://api-dev.trucklinemp.com
   * - http://localhost:3000/api/v1
   */
  baseUrl?: string;
  /** Defaults to production */
  environment?: ApiEnvironment;
  /** Extra headers on every request */
  headers?: Record<string, string>;
  /** Fetch timeout in ms (default 30_000) */
  timeoutMs?: number;
  /** Max automatic retries on 429 (default 1) */
  maxRetries?: number;
  /** Custom fetch (edge / polyfill) */
  fetch?: typeof fetch;
  /** User-Agent for server runtimes (ignored in browsers) */
  userAgent?: string;
};

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  body?: unknown;
  /** Override auth for this call only */
  apiKey?: string | null;
  signal?: AbortSignal;
};

export type PaginationQuery = {
  page?: number;
  limit?: number;
  cursor?: string;
};

export const DEFAULT_BASE_URLS: Record<ApiEnvironment, string> = {
  production: "https://api.trucklinemp.com",
  development: "https://api-dev.trucklinemp.com",
};
