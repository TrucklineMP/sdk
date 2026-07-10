# Changelog

All notable changes to **`@trucklinemp/sdk`** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project follows [Semantic Versioning](https://semver.org/).

Docs: [TypeScript SDK](https://docs.trucklinemp.com/guides/developers/sdk/) · npm: [@trucklinemp/sdk](https://www.npmjs.com/package/@trucklinemp/sdk)

---

## [0.2.0] — 2026-07-10

Major expansion of the official client: typed models, better HTTP reliability, pagination and batch helpers, OAuth, and webhooks.

### Added

- **TypeScript models** for common Public API shapes (users, VTCs, events, news, bans, programs, game servers, OAuth userinfo, webhook deliveries, and related types).
- **`Truckline.VERSION` / `SDK_VERSION`** and a default User-Agent of `trucklinemp-sdk/<version>`.
- **Request lifecycle hooks:** `onRequest`, `onResponse`, and optional `debug` logging.
- **`lastRateLimit`** on the client (from `Retry-After` / rate-limit response headers when present).
- **Pagination helpers** on resources, including:
  - `vtcs.iterate` / `vtcs.listAll` / `vtcs.iterateMembers`
  - `users.iterateSearch` / `users.searchAll`
  - `bans.iterate`
- **`users.getBySteam(steamId)`** and **`users.resolve(...)`** for public profile lookup.
- **Batch auto-chunking** (max 50 ids per request) for `users.batch` and `vtcs.batch` (arrays or rest args).
- **OAuth helpers:** `TrucklineOAuth`, `generatePkce()` — authorize URL, code exchange, refresh, revoke, userinfo.
  - Subpath: `@trucklinemp/sdk/oauth`
- **Webhook helpers:** signature verify/sign, header constants, `parseWebhookBody`, `createWebhookHandler`.
  - Subpath: `@trucklinemp/sdk/webhooks`
  - Header used in production: `X-TrucklineMP-Signature` (`sha256=<hex>`).
- Shared utilities: `buildUrl`, `chunkIds`, `iteratePages` / `collectPages`, `DEFAULT_SITE_URL`, `BATCH_MAX`.
- Package **examples** (`examples/basic.mjs`, `oauth-pkce.mjs`, `webhook-express.mjs`).
- Automated **unit tests** (Vitest).

### Changed

- HTTP client retries **429** and **5xx** (when `retryOnServerError` is enabled, default `true`) with jitter; network errors may retry up to `maxRetries`.
- Abort handling distinguishes **`TIMEOUT`** vs caller **`ABORTED`**.
- `TrucklineError` gains helpers: `isTimeout`, `isNetworkError`, `isServerError`, `isValidationError`, and `causeError`.
- Resource methods return **typed** responses where models are defined (still tolerant of extra API fields).
- Default base URL remains `https://api.trucklinemp.com`.

### Package exports

| Import | Purpose |
|--------|---------|
| `@trucklinemp/sdk` | Public API client, types, OAuth + webhooks re-exports |
| `@trucklinemp/sdk/oauth` | OAuth / PKCE only |
| `@trucklinemp/sdk/webhooks` | Webhook verify / handlers (Node `crypto`) |

### Docs

- Full guide: https://docs.trucklinemp.com/guides/developers/sdk/
- Contributing: https://docs.trucklinemp.com/guides/developers/sdk-contributing/

### Upgrade notes from 0.1.x

- **0.2.0 is additive** for typical Public API usage (`new Truckline({ apiKey })`, `tl.vtcs.*`, `tl.users.get`, etc.).
- Prefer importing OAuth/webhooks from the subpaths if you want a narrower surface.
- Webhook verification should use the **`X-TrucklineMP-Signature`** header value as delivered (same `sha256=` format as before).
- If you depended on completely untyped returns, you may see stricter TypeScript inference; cast or widen only if you need extra fields not yet in the models.

---

## [0.1.1] — 2026-06

### Added

- Initial public npm release: thin Public API client (`Truckline`), `TrucklineError`, basic 429 retry, and webhook HMAC verify/sign helpers.

---

[0.2.0]: https://github.com/trucklinemp/sdk/releases/tag/v0.2.0
[0.1.1]: https://github.com/trucklinemp/sdk/releases/tag/v0.1.1
