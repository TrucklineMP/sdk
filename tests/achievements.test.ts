import { describe, expect, it, vi } from "vitest";
import { Truckline } from "../src/client.js";

describe("achievements", () => {
  it("lists the active achievements catalog", async () => {
    const catalog = {
      achievements: [
        {
          slug: "first-convoy",
          name: "First Convoy",
          description: "Attend your first event",
          icon: "🚛",
          color: "#336699",
          points: 10,
        },
      ],
    };
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(catalog), { status: 200 }),
    );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const res = await tl.achievements.list();
    expect(res).toEqual(catalog);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain("/achievements");
  });

  it("fetches user achievements by handle", async () => {
    const payload = {
      achievements: [
        {
          slug: "first-convoy",
          name: "First Convoy",
          description: null,
          icon: "🚛",
          color: "#336699",
          points: 10,
          grantedAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    };
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(payload), { status: 200 }),
    );
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const res = await tl.users.achievements("driver-handle");
    expect(res).toEqual(payload);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain("/users/driver-handle/achievements");
  });
});
