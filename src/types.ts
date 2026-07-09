export type TrucklineClientOptions = {
  /**
   * Public API key (`tlmp_api_...`) from the developer console.
   * Optional for purely anonymous endpoints (stricter rate limits).
   */
  apiKey?: string;
  /**
   * Override base URL. Defaults to production.
   * Examples:
   * - https://api.trucklinemp.com
   * - http://localhost:3000/api/v1
   */
  baseUrl?: string;
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

/** Default Public API base URL (production). */
export const DEFAULT_BASE_URL = "https://api.trucklinemp.com";
