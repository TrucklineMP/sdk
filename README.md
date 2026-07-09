# @trucklinemp/sdk

Official TypeScript and JavaScript client for the TrucklineMP public API.

Use it to call the public API with less boilerplate, handle rate limits cleanly, and verify webhook signatures in Node.js.

| | |
|---|---|
| **Package** | `@trucklinemp/sdk` |
| **Registry** | [npmjs.com](https://www.npmjs.com/package/@trucklinemp/sdk) |
| **Repository** | [github.com/trucklinemp/sdk](https://github.com/trucklinemp/sdk) |
| **License** | MIT |
| **Node** | 18+ |

Full product docs: [TypeScript SDK](https://docs.trucklinemp.com/guides/developers/sdk/) on the TrucklineMP docs site.

## Requirements

- Node.js 18 or newer (uses global `fetch`)
- A TrucklineMP developer account and API key from the [Developer Console](https://trucklinemp.com/developer) for higher rate limits

Webhook helpers (`verifyWebhookSignature`, `signWebhookPayload`) use Node's `crypto` module and are for server runtimes only.

## Install

```bash
npm install @trucklinemp/sdk
```

No special registry config. This is the public npm package.

## Quick start

```ts
import { Truckline, TrucklineError } from "@trucklinemp/sdk";

const tl = new Truckline({
  apiKey: process.env.TRUCKLINE_API_KEY, // tlmp_api_...
});

const version = await tl.meta.version();
console.log(version);

const vtc = await tl.vtcs.get("my-vtc-handle");
console.log(vtc);

try {
  await tl.users.get("someone");
} catch (err) {
  if (err instanceof TrucklineError) {
    console.error(err.status, err.code, err.requestId, err.message);
    if (err.isRateLimited) {
      console.error("Retry after (seconds):", err.retryAfter);
    }
  }
}
```

Anonymous calls (no key) work on many public routes but use lower rate limits. Always send a key in production.

## Configuration

```ts
new Truckline({
  apiKey: "tlmp_api_...",           // optional for anonymous access
  baseUrl: undefined,               // default: https://api.trucklinemp.com
  timeoutMs: 30_000,
  maxRetries: 1,                    // retries on HTTP 429 only
  headers: { "X-App": "my-bot" },   // optional extra headers
  userAgent: "my-bot/1.0",          // Node only
  fetch: customFetch,               // optional
});
```

### Base URL

| Option | Base URL |
|--------|----------|
| Default | `https://api.trucklinemp.com` |
| Local override | `http://localhost:3000/api/v1` |

```ts
new Truckline({
  apiKey: process.env.TRUCKLINE_API_KEY,
  baseUrl: "http://localhost:3000/api/v1",
});
```

Do **not** append an extra `/v1` to `api.trucklinemp.com`. That host already maps to the v1 API.

See the [Public API guide](https://docs.trucklinemp.com/guides/developers/public-api/) for authentication and rate limits.

## API surface

### Meta and platform

```ts
await tl.meta.version();
await tl.meta.status();
await tl.meta.stats();
await tl.meta.partners();
await tl.meta.rules();
await tl.meta.session();
await tl.meta.recruitmentOpen();
```

### VTCs

```ts
await tl.vtcs.list({ limit: 20 });
await tl.vtcs.get("handle-or-id");
await tl.vtcs.members("handle-or-id");
await tl.vtcs.news(42);
await tl.vtcs.events(42);
await tl.vtcs.roles(42);
await tl.vtcs.gallery(42);
await tl.vtcs.tier(42);
await tl.vtcs.liveEvents(42);
await tl.vtcs.upcomingEvents(42);
await tl.vtcs.batch([1, 2, 3]);
```

### Events, users, news, bans

```ts
await tl.events.list();
await tl.events.get(eventId);
await tl.events.attendees(eventId);
await tl.events.slots(eventId);

await tl.users.search({ q: "alex" });
await tl.users.get("handle-or-id");
await tl.users.batch(["id1", "id2"]);
await tl.users.bans(userId);
await tl.users.events(userId);

await tl.news.list();
await tl.news.get(newsId);

await tl.bans.list();
await tl.bans.get(banId);
```

### Programs and game

```ts
await tl.programs.badge("badge-slug");
await tl.programs.recognition();
await tl.game.servers();
```

### Escape hatch

For paths not wrapped yet:

```ts
await tl.get("/version");
await tl.request("GET", "/vtcs", { query: { limit: 5 } });
```

## Errors

Failed HTTP responses throw `TrucklineError`:

| Property | Meaning |
|----------|---------|
| `status` | HTTP status (0 for network/timeout) |
| `code` | API error code when present (`RATE_LIMITED`, `NOT_FOUND`, ...) |
| `requestId` | Correlation id for support |
| `retryAfter` | Seconds from `Retry-After` on 429 when available |
| `details` | Extra payload if the API sent one |

Helpers: `err.isRateLimited`, `err.isNotFound`, `err.isUnauthorized`, `err.isForbidden`.

By default the client retries **once** on `429` after waiting for `Retry-After` (or 1 second). Set `maxRetries: 0` to disable.

## Webhooks (Node.js)

Signatures use HMAC-SHA256 over the **raw body**:

```
X-TrucklineMP-Signature: sha256=<hex>
```

```ts
import { verifyWebhookSignature, signWebhookPayload } from "@trucklinemp/sdk";

// Express: use express.raw() or equivalent so body is not re-parsed first
const ok = verifyWebhookSignature(
  rawBody,
  req.headers["x-trucklinemp-signature"],
  process.env.WEBHOOK_SECRET!,
);

if (!ok) {
  res.status(401).send("invalid signature");
  return;
}
```

See [Webhooks](https://docs.trucklinemp.com/guides/developers/webhooks/) for delivery format, retries, and the event catalog.

## TypeScript

The package ships type declarations. Response bodies are typed loosely as `unknown`-friendly generics in places so OpenAPI changes do not break every release. Prefer validating important shapes in your app if you need strict schemas.

## Development (this package)

```bash
cd sdk
npm install
npm run build
npm run typecheck
```

Maintainer publish steps: see [PUBLISH.md](./PUBLISH.md).

## Related links

| Resource | URL |
|----------|-----|
| Developer Console | https://trucklinemp.com/developer |
| OpenAPI JSON | https://trucklinemp.com/api/v1/openapi.json |
| Public API docs | https://docs.trucklinemp.com/guides/developers/public-api/ |
| Platform overview | https://docs.trucklinemp.com/guides/developers/overview/ |
| GitHub | https://github.com/trucklinemp/sdk |

## License

MIT. See [LICENSE](./LICENSE).
