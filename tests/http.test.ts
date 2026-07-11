import { describe, expect, it, vi } from "vitest";
import { Truckline } from "../src/client.js";
import { TrucklineError } from "../src/errors.js";
import { buildUrl, parseRateLimit } from "../src/http.js";
import { SDK_VERSION } from "../src/version.js";

describe("buildUrl", () => {
  it("joins base and path and serializes query", () => {
    expect(
      buildUrl("https://api.trucklinemp.com", "/users/search", {
        q: "a",
        page: 1,
        empty: null,
      }),
    ).toBe("https://api.trucklinemp.com/users/search?q=a&page=1");
  });

  it("strips trailing slashes on base", () => {
    expect(buildUrl("https://api.trucklinemp.com/", "vtcs", undefined)).toBe(
      "https://api.trucklinemp.com/vtcs",
    );
  });
});

describe("parseRateLimit", () => {
  it("reads retry-after and ratelimit headers", () => {
    const headers = new Headers({
      "retry-after": "30",
      "x-ratelimit-limit": "1000",
      "x-ratelimit-remaining": "999",
      "x-ratelimit-reset": "1700000000",
    });
    expect(parseRateLimit(headers)).toEqual({
      retryAfter: 30,
      limit: 1000,
      remaining: 999,
      reset: 1700000000,
    });
  });
});

describe("Truckline http", () => {
  it("sends bearer auth and parses json", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ api: "1", app: "2" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const tl = new Truckline({
      apiKey: "tlmp_api_test",
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const version = await tl.meta.version();
    expect(version).toEqual({ api: "1", app: "2" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/version");
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer tlmp_api_test");
    expect(headers.get("user-agent")).toContain(SDK_VERSION);
  });

  it("throws TrucklineError with code from envelope", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "missing", requestId: "r1" },
        }),
        { status: 404, headers: { "x-request-id": "r1" } },
      ),
    );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
    });
    await expect(tl.users.get("nope")).rejects.toMatchObject({
      name: "TrucklineError",
      status: 404,
      code: "NOT_FOUND",
      isNotFound: true,
    });
  });

  it("retries on 429 then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 429,
          headers: { "retry-after": "0" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 1,
    });
    const res = await tl.get("/status");
    expect(res).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("exposes VERSION", () => {
    expect(Truckline.VERSION).toBe(SDK_VERSION);
    expect(new Truckline().version).toBe(SDK_VERSION);
  });

  it("maps abort without timeout to ABORTED", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.signal?.aborted) {
        const err = new Error("Aborted");
        err.name = "AbortError";
        throw err;
      }
      return new Response("{}", { status: 200 });
    });
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 0,
    });
    try {
      await tl.get("/version", { signal: controller.signal });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(TrucklineError);
      expect((err as TrucklineError).code).toBe("ABORTED");
    }
  });

  it("maps timeout to TIMEOUT", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (init?.signal?.aborted) {
        const err = new Error("Aborted");
        err.name = "AbortError";
        throw err;
      }
      return new Response("{}", { status: 200 });
    });
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
      timeoutMs: 1,
      maxRetries: 0,
    });
    await expect(tl.get("/version")).rejects.toMatchObject({
      code: "TIMEOUT",
      isTimeout: true,
    });
  });

  it("retries on 5xx then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 1,
    });
    const res = await tl.meta.status();
    expect(res).toEqual({ status: "ok" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries network errors then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ api: "1", app: "2" }), { status: 200 }),
      );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 1,
    });
    const version = await tl.meta.version();
    expect(version).toEqual({ api: "1", app: "2" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws NETWORK_ERROR after retries exhausted", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
      maxRetries: 0,
    });
    await expect(tl.get("/version")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      isNetworkError: true,
    });
  });

  it("invokes onRequest and onResponse hooks", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "x-request-id": "req-1" },
      }),
    );
    const onRequest = vi.fn();
    const onResponse = vi.fn();
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
      onRequest,
      onResponse,
    });
    await tl.get("/status");
    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", attempt: 0 }),
    );
    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, requestId: "req-1", attempt: 0 }),
    );
  });

  it("stores lastRateLimit after a request", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "x-ratelimit-limit": "1000",
          "x-ratelimit-remaining": "42",
        },
      }),
    );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
    });
    await tl.get("/status");
    expect(tl.lastRateLimit).toEqual({
      retryAfter: null,
      limit: 1000,
      remaining: 42,
      reset: null,
    });
  });

  it("posts json bodies", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
    });
    await tl.post("/echo", { body: { hello: "world" } });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ hello: "world" }));
    const headers = new Headers(init.headers);
    expect(headers.get("content-type")).toBe("application/json");
  });
});
