# Changelog

## 0.2.0

- Typed models for public API responses (`PublicUser`, `VtcListItem`, events, bans, …)
- `Truckline.VERSION` / `SDK_VERSION` and versioned User-Agent
- Request/response hooks (`onRequest`, `onResponse`) and `debug` logging
- Retry on 429 and 5xx with jitter; distinguish `TIMEOUT` vs `ABORTED`
- Rate-limit header capture via `lastRateLimit`
- Pagination helpers: `iterate` / `listAll` / `searchAll` / `iterateSearch`
- Batch auto-chunking (max 50) for `users.batch` and `vtcs.batch`
- `users.getBySteam`, `users.resolve`
- OAuth client: `TrucklineOAuth`, `generatePkce` (also `@trucklinemp/sdk/oauth`)
- Webhook helpers: event parsing, header constants, `createWebhookHandler` (also `@trucklinemp/sdk/webhooks`)
- Tests (vitest), examples, expanded docs site guide

## 0.1.1

- Initial public npm release of the thin Public API client
