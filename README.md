# @trucklinemp/sdk

Official TypeScript / JavaScript client for the TrucklineMP Public API, OAuth, and webhooks.

| | |
|---|---|
| **Package** | `@trucklinemp/sdk` |
| **npm** | [npmjs.com/package/@trucklinemp/sdk](https://www.npmjs.com/package/@trucklinemp/sdk) |
| **Docs** | [docs.trucklinemp.com — TypeScript SDK](https://docs.trucklinemp.com/guides/developers/sdk/) |
| **Contributing** | [SDK contributing guide](https://docs.trucklinemp.com/guides/developers/sdk-contributing/) |
| **Node** | 18+ |
| **License** | MIT |

Full usage documentation lives on the docs site (resources, types, OAuth, webhooks, pagination, errors). This README is a short entry point.

## Install

```bash
npm install @trucklinemp/sdk
```

## Quick start

```ts
import { Truckline, TrucklineError } from "@trucklinemp/sdk";

const tl = new Truckline({
  apiKey: process.env.TRUCKLINE_API_KEY,
});

const version = await tl.meta.version();
const { user } = await tl.users.get("some-handle");
console.log(user.steamId, user.webId);

try {
  await tl.vtcs.get("missing");
} catch (err) {
  if (err instanceof TrucklineError && err.isNotFound) {
    console.error(err.requestId, err.message);
  }
}
```

### Entry points

| Import | Use |
|--------|-----|
| `@trucklinemp/sdk` | Public API client, types, OAuth + webhooks re-exports |
| `@trucklinemp/sdk/oauth` | OAuth / PKCE only |
| `@trucklinemp/sdk/webhooks` | Webhook verify / handler only (Node `crypto`) |

## Develop

```bash
npm install
npm run typecheck
npm test
npm run build
```

Examples: `examples/basic.mjs`, `examples/oauth-pkce.mjs`, `examples/webhook-express.mjs` (run after `npm run build`).

Publish notes: [PUBLISH.md](./PUBLISH.md) · Changes: [CHANGELOG.md](./CHANGELOG.md) · PRs: [CONTRIBUTING.md](./CONTRIBUTING.md)
