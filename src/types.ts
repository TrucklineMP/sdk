export type TrucklineClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  retryOnServerError?: boolean;
  fetch?: typeof fetch;
  userAgent?: string;
  debug?: boolean;
  onRequest?: (info: RequestHookInfo) => void | Promise<void>;
  onResponse?: (info: ResponseHookInfo) => void | Promise<void>;
};

export type RequestHookInfo = {
  method: string;
  url: string;
  attempt: number;
};

export type ResponseHookInfo = {
  method: string;
  url: string;
  status: number;
  requestId: string | null;
  attempt: number;
  durationMs: number;
};

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  body?: unknown;
  apiKey?: string | null;
  signal?: AbortSignal;
};

export type PaginationQuery = {
  page?: number;
  limit?: number;
  cursor?: string | number;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: number | null;
  total: number;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type RateLimitInfo = {
  retryAfter: number | null;
  limit?: number | null;
  remaining?: number | null;
  reset?: number | null;
};

export const DEFAULT_BASE_URL = "https://api.trucklinemp.com";
export const DEFAULT_SITE_URL = "https://trucklinemp.com";
export const BATCH_MAX = 50;
