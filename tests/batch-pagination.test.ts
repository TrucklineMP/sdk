import { describe, expect, it, vi } from "vitest";
import { chunkIds, normalizeIdList } from "../src/batch.js";
import { collectPages, iteratePages } from "../src/pagination.js";
import { Truckline } from "../src/client.js";

describe("batch helpers", () => {
  it("chunks and dedupes", () => {
    expect(chunkIds(["a", "b", "a", "c"], 2)).toEqual([
      ["a", "b"],
      ["c"],
    ]);
  });

  it("normalizes id lists", () => {
    expect(normalizeIdList(1, 2, 3)).toEqual(["1", "2", "3"]);
    expect(normalizeIdList(["x", "y"])).toEqual(["x", "y"]);
  });
});

describe("pagination helpers", () => {
  it("iterates until done", async () => {
    const pages = [
      { items: [1, 2], done: false },
      { items: [3], done: true },
    ];
    let i = 0;
    const collected: number[][] = [];
    for await (const page of iteratePages(async () => pages[i++]!)) {
      collected.push(page);
    }
    expect(collected).toEqual([[1, 2], [3]]);
  });

  it("collectPages respects maxItems", async () => {
    const out = await collectPages(
      async (page) => ({
        items: [page * 10, page * 10 + 1],
        done: page >= 5,
      }),
      { maxItems: 3 },
    );
    expect(out).toEqual([0, 1, 10]);
  });
});

describe("users.batch chunking", () => {
  it("splits over BATCH_MAX", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `u${i}`);
    const fetchImpl = vi.fn(async (url: string) => {
      const u = new URL(url);
      const chunk = (u.searchParams.get("ids") ?? "").split(",");
      return new Response(
        JSON.stringify({
          users: chunk.map((id) => ({
            id,
            webId: 1,
            handle: null,
            name: id,
            image: null,
            steamId: null,
            createdAt: "2020-01-01T00:00:00.000Z",
            vtc: null,
            staffRoles: [],
            social: null,
            gameStatus: null,
          })),
        }),
        { status: 200 },
      );
    });
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const res = await tl.users.batch(ids);
    expect(res.users).toHaveLength(51);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("vtcs.batch chunking", () => {
  it("splits over BATCH_MAX", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => i + 1);
    const fetchImpl = vi.fn(async (url: string) => {
      const u = new URL(url);
      const chunk = (u.searchParams.get("ids") ?? "").split(",");
      return new Response(
        JSON.stringify({
          vtcs: chunk.map((id) => ({
            id: Number(id),
            name: `VTC ${id}`,
            handle: null,
            description: "",
            slogan: null,
            profilePicture: null,
            banner: null,
            verified: false,
            official: false,
            partnered: false,
            recruitmentOpen: true,
            visibility: "public",
            language: "en",
            memberCount: 1,
            createdAt: "2020-01-01T00:00:00.000Z",
          })),
        }),
        { status: 200 },
      );
    });
    const tl = new Truckline({
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const res = await tl.vtcs.batch(ids);
    expect(res.vtcs).toHaveLength(51);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
