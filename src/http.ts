import { TrucklineError, type TrucklineErrorBody } from "./errors.js";
import type {
  RateLimitInfo,
  RequestOptions,
  TrucklineClientOptions,
} from "./types.js";
import { DEFAULT_BASE_URL } from "./types.js";
import { SDK_VERSION } from "./version.js";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions["query"],
): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${p}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function parseRetryAfter(headers: Headers): number | null {
  const raw = headers.get("retry-after");
  if (!raw) return null;
  const asInt = Number(raw);
  if (Number.isFinite(asInt) && asInt >= 0) return Math.ceil(asInt);
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return null;
}

function parseHeaderInt(headers: Headers, name: string): number | null {
  const raw = headers.get(name);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseRateLimit(headers: Headers): RateLimitInfo {
  return {
    retryAfter: parseRetryAfter(headers),
    limit:
      parseHeaderInt(headers, "x-ratelimit-limit") ??
      parseHeaderInt(headers, "ratelimit-limit"),
    remaining:
      parseHeaderInt(headers, "x-ratelimit-remaining") ??
      parseHeaderInt(headers, "ratelimit-remaining"),
    reset:
      parseHeaderInt(headers, "x-ratelimit-reset") ??
      parseHeaderInt(headers, "ratelimit-reset"),
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

function jitterMs(baseSeconds: number): number {
  const base = Math.max(0, baseSeconds) * 1000;
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

export class HttpClient {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryOnServerError: boolean;
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;
  private readonly debug: boolean;
  private readonly onRequest?: TrucklineClientOptions["onRequest"];
  private readonly onResponse?: TrucklineClientOptions["onResponse"];
  lastRateLimit: RateLimitInfo | null = null;

  constructor(opts: TrucklineClientOptions) {
    this.baseUrl = normalizeBaseUrl(opts.baseUrl ?? DEFAULT_BASE_URL);
    this.apiKey = opts.apiKey;
    this.defaultHeaders = { ...(opts.headers ?? {}) };
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.maxRetries = opts.maxRetries ?? 1;
    this.retryOnServerError = opts.retryOnServerError ?? true;
    this.fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);
    this.userAgent = opts.userAgent ?? `trucklinemp-sdk/${SDK_VERSION}`;
    this.debug = opts.debug ?? false;
    this.onRequest = opts.onRequest;
    this.onResponse = opts.onResponse;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = buildUrl(this.baseUrl, path, options.query);
    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.timeoutMs);

      const onAbort = () => controller.abort();
      if (options.signal) {
        if (options.signal.aborted) controller.abort();
        else options.signal.addEventListener("abort", onAbort, { once: true });
      }

      const started = Date.now();
      try {
        await this.onRequest?.({ method, url, attempt });
        if (this.debug) {
          console.debug(`[trucklinemp-sdk] → ${method} ${url} attempt=${attempt}`);
        }

        const headers = new Headers({
          Accept: "application/json",
          ...this.defaultHeaders,
          ...options.headers,
        });

        if (typeof window === "undefined" && !headers.has("user-agent")) {
          headers.set("user-agent", this.userAgent);
        }

        const key =
          options.apiKey === null ? undefined : (options.apiKey ?? this.apiKey);
        if (key) {
          headers.set(
            "authorization",
            key.startsWith("Bearer ") ? key : `Bearer ${key}`,
          );
        }

        let body: string | undefined;
        if (options.body !== undefined && method !== "GET" && method !== "HEAD") {
          headers.set("content-type", "application/json");
          body = JSON.stringify(options.body);
        }

        const res = await this.fetchImpl(url, {
          method,
          headers,
          body,
          signal: controller.signal,
        });

        this.lastRateLimit = parseRateLimit(res.headers);
        const requestId =
          res.headers.get("x-request-id") ??
          res.headers.get("x-trucklinemp-request-id");

        const shouldRetry429 = res.status === 429 && attempt < this.maxRetries;
        const shouldRetry5xx =
          this.retryOnServerError &&
          res.status >= 500 &&
          res.status < 600 &&
          attempt < this.maxRetries;

        if (shouldRetry429 || shouldRetry5xx) {
          const retryAfter = this.lastRateLimit.retryAfter ?? 1;
          attempt += 1;
          await sleep(jitterMs(retryAfter));
          continue;
        }

        const text = await res.text();
        let data: unknown = null;
        if (text) {
          try {
            data = JSON.parse(text) as unknown;
          } catch {
            data = text;
          }
        }

        await this.onResponse?.({
          method,
          url,
          status: res.status,
          requestId,
          attempt,
          durationMs: Date.now() - started,
        });

        if (this.debug) {
          console.debug(
            `[trucklinemp-sdk] ← ${res.status} ${method} ${url} ${Date.now() - started}ms`,
          );
        }

        if (!res.ok) {
          const envelope = data as { error?: TrucklineErrorBody } | null;
          const errBody = envelope?.error ?? (data as TrucklineErrorBody) ?? {};
          throw new TrucklineError({
            message:
              errBody.message || `Request failed with status ${res.status}`,
            status: res.status,
            code: errBody.code,
            requestId: errBody.requestId ?? requestId,
            details: errBody.details,
            retryAfter: this.lastRateLimit.retryAfter,
          });
        }

        return data as T;
      } catch (err) {
        if (err instanceof TrucklineError) throw err;
        if (err instanceof Error && err.name === "AbortError") {
          const callerAborted = Boolean(options.signal?.aborted) && !timedOut;
          throw new TrucklineError({
            message: callerAborted ? "Request was aborted" : "Request timed out",
            status: 0,
            code: callerAborted ? "ABORTED" : "TIMEOUT",
            cause: err,
          });
        }
        if (attempt < this.maxRetries) {
          attempt += 1;
          await sleep(jitterMs(0.5 * attempt));
          continue;
        }
        throw new TrucklineError({
          message: err instanceof Error ? err.message : "Network error",
          status: 0,
          code: "NETWORK_ERROR",
          cause: err,
        });
      } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener("abort", onAbort);
      }
    }
  }

  get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, options);
  }

  post<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", path, options);
  }
}
