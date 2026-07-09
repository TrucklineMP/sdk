import { TrucklineError, type TrucklineErrorBody } from "./errors.js";
import type { RequestOptions, TrucklineClientOptions } from "./types.js";
import { DEFAULT_BASE_URLS } from "./types.js";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function buildUrl(
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

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export class HttpClient {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;

  constructor(opts: TrucklineClientOptions) {
    const env = opts.environment ?? "production";
    this.baseUrl = normalizeBaseUrl(
      opts.baseUrl ?? DEFAULT_BASE_URLS[env],
    );
    this.apiKey = opts.apiKey;
    this.defaultHeaders = { ...(opts.headers ?? {}) };
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.maxRetries = opts.maxRetries ?? 1;
    this.fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);
    this.userAgent = opts.userAgent ?? `trucklinemp-sdk/0.1.0`;
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
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const onAbort = () => controller.abort();
      if (options.signal) {
        if (options.signal.aborted) controller.abort();
        else options.signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        const headers = new Headers({
          Accept: "application/json",
          ...this.defaultHeaders,
          ...options.headers,
        });

        if (typeof window === "undefined" && !headers.has("user-agent")) {
          headers.set("user-agent", this.userAgent);
        }

        const key =
          options.apiKey === null
            ? undefined
            : (options.apiKey ?? this.apiKey);
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

        if (res.status === 429 && attempt < this.maxRetries) {
          const retryAfter = parseRetryAfter(res.headers) ?? 1;
          attempt += 1;
          await sleep(retryAfter * 1000);
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

        if (!res.ok) {
          const envelope = data as { error?: TrucklineErrorBody } | null;
          const errBody = envelope?.error ?? (data as TrucklineErrorBody) ?? {};
          throw new TrucklineError({
            message:
              errBody.message ||
              `Request failed with status ${res.status}`,
            status: res.status,
            code: errBody.code,
            requestId:
              errBody.requestId ?? res.headers.get("x-request-id"),
            details: errBody.details,
            retryAfter: parseRetryAfter(res.headers),
          });
        }

        return data as T;
      } catch (err) {
        if (err instanceof TrucklineError) throw err;
        if (err instanceof Error && err.name === "AbortError") {
          throw new TrucklineError({
            message: "Request timed out or was aborted",
            status: 0,
            code: "TIMEOUT",
          });
        }
        throw new TrucklineError({
          message: err instanceof Error ? err.message : "Network error",
          status: 0,
          code: "NETWORK_ERROR",
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
