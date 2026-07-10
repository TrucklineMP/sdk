import { chunkIds, normalizeIdList } from "./batch.js";
import type { HttpClient } from "./http.js";
import type {
  GameServer,
  PublicAchievementsCatalog,
  PublicBanDetail,
  PublicBanListItem,
  PublicBadgeProgram,
  PublicEvent,
  PublicEventAttendee,
  PublicEventSlot,
  PublicNewsItem,
  PublicPartner,
  PublicRecognitionPrograms,
  PublicRules,
  PublicUser,
  PublicUserAchievements,
  PublicUserBatchResponse,
  PublicUserBans,
  PublicUserProfileResponse,
  PublicUserSearchResponse,
  PublicVersion,
  VtcListItem,
  VtcMember,
  VtcNewsItem,
  VtcRole,
} from "./models.js";
import { collectPages, iteratePages } from "./pagination.js";
import type {
  CursorPage,
  PaginationQuery,
  RequestOptions,
} from "./types.js";
import { BATCH_MAX } from "./types.js";

type Id = string | number;

function withOpts(
  query?: Record<string, string | number | boolean | undefined | null>,
  options?: RequestOptions,
): RequestOptions {
  return { ...options, query: { ...options?.query, ...query } };
}

function asCursorPage<T>(raw: unknown): CursorPage<T> {
  const r = raw as Partial<CursorPage<T>> & { data?: T[] };
  if (Array.isArray(r.items)) {
    return {
      items: r.items,
      nextCursor: r.nextCursor ?? null,
      total: r.total ?? r.items.length,
    };
  }
  if (Array.isArray(r.data)) {
    return {
      items: r.data,
      nextCursor: (r as { nextCursor?: number | null }).nextCursor ?? null,
      total: r.total ?? r.data.length,
    };
  }
  if (Array.isArray(raw)) {
    return { items: raw as T[], nextCursor: null, total: (raw as T[]).length };
  }
  return { items: [], nextCursor: null, total: 0 };
}

export class VtcsResource {
  constructor(private readonly http: HttpClient) {}

  list(
    query?: PaginationQuery & { q?: string; sort?: string },
    options?: RequestOptions,
  ) {
    return this.http.get<CursorPage<VtcListItem> | { items?: VtcListItem[]; data?: VtcListItem[] }>(
      "/vtcs",
      withOpts(query, options),
    );
  }

  async *iterate(
    query?: Omit<PaginationQuery, "cursor"> & { q?: string; sort?: string; maxPages?: number },
    options?: RequestOptions,
  ): AsyncGenerator<VtcListItem[], void, unknown> {
    const { maxPages, ...rest } = query ?? {};
    let cursor: number | string | undefined = 0;
    let page = 0;
    const limit = rest.limit ?? 20;
    while (page < (maxPages ?? 100)) {
      const raw = await this.list({ ...rest, limit, cursor }, options);
      const pageData = asCursorPage<VtcListItem>(raw);
      if (pageData.items.length === 0) return;
      yield pageData.items;
      if (pageData.nextCursor == null) return;
      cursor = pageData.nextCursor;
      page += 1;
    }
  }

  async listAll(
    query?: Omit<PaginationQuery, "cursor"> & {
      q?: string;
      sort?: string;
      maxPages?: number;
      maxItems?: number;
    },
    options?: RequestOptions,
  ): Promise<VtcListItem[]> {
    const out: VtcListItem[] = [];
    const maxItems = query?.maxItems ?? Number.POSITIVE_INFINITY;
    for await (const items of this.iterate(query, options)) {
      for (const item of items) {
        out.push(item);
        if (out.length >= maxItems) return out;
      }
    }
    return out;
  }

  get(idOrHandle: Id, options?: RequestOptions) {
    return this.http.get<VtcListItem & Record<string, unknown>>(
      `/vtcs/${encodeURIComponent(String(idOrHandle))}`,
      options,
    );
  }

  async batch(
    ids: Array<string | number> | string | number,
    ...rest: Array<string | number>
  ): Promise<{ vtcs?: VtcListItem[]; items?: VtcListItem[]; [key: string]: unknown }> {
    const list = normalizeIdList(ids, ...rest);
    const chunks = chunkIds(list, BATCH_MAX);
    const merged: VtcListItem[] = [];
    let last: Record<string, unknown> = {};
    for (const chunk of chunks) {
      const res = await this.http.get<Record<string, unknown>>("/vtcs/batch", {
        query: { ids: chunk.join(",") },
      });
      last = res;
      const items =
        (res.vtcs as VtcListItem[] | undefined) ??
        (res.items as VtcListItem[] | undefined) ??
        (res.data as VtcListItem[] | undefined) ??
        [];
      merged.push(...items);
    }
    return { ...last, vtcs: merged, items: merged };
  }

  members(idOrHandle: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get<CursorPage<VtcMember>>(
      `/vtcs/${encodeURIComponent(String(idOrHandle))}/members`,
      withOpts(query, options),
    );
  }

  async *iterateMembers(
    idOrHandle: Id,
    query?: Omit<PaginationQuery, "cursor"> & { maxPages?: number },
    options?: RequestOptions,
  ): AsyncGenerator<VtcMember[], void, unknown> {
    const { maxPages, ...rest } = query ?? {};
    let cursor: number | string | undefined = 0;
    let page = 0;
    while (page < (maxPages ?? 100)) {
      const raw = await this.members(idOrHandle, { ...rest, cursor }, options);
      const pageData = asCursorPage<VtcMember>(raw);
      if (pageData.items.length === 0) return;
      yield pageData.items;
      if (pageData.nextCursor == null) return;
      cursor = pageData.nextCursor;
      page += 1;
    }
  }

  news(id: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get<CursorPage<VtcNewsItem> | { items: VtcNewsItem[] }>(
      `/vtcs/${encodeURIComponent(String(id))}/news`,
      withOpts(query, options),
    );
  }

  events(id: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get<CursorPage<PublicEvent> | { items: PublicEvent[] }>(
      `/vtcs/${encodeURIComponent(String(id))}/events`,
      withOpts(query, options),
    );
  }

  roles(id: Id, options?: RequestOptions) {
    return this.http.get<{ items?: VtcRole[]; roles?: VtcRole[] } | VtcRole[]>(
      `/vtcs/${encodeURIComponent(String(id))}/roles`,
      options,
    );
  }

  gallery(id: Id, options?: RequestOptions) {
    return this.http.get(`/vtcs/${encodeURIComponent(String(id))}/gallery`, options);
  }

  tier(id: Id, options?: RequestOptions) {
    return this.http.get(`/vtcs/${encodeURIComponent(String(id))}/tier`, options);
  }

  liveEvents(id: Id, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(id))}/events/live`,
      options,
    );
  }

  upcomingEvents(id: Id, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(id))}/events/upcoming`,
      options,
    );
  }
}

export class EventsResource {
  constructor(private readonly http: HttpClient) {}

  list(query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get<CursorPage<PublicEvent> | { items?: PublicEvent[] }>(
      "/events",
      withOpts(query, options),
    );
  }

  get(eventId: Id, options?: RequestOptions) {
    return this.http.get<PublicEvent>(
      `/events/${encodeURIComponent(String(eventId))}`,
      options,
    );
  }

  attendees(eventId: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get<{ items: PublicEventAttendee[]; total: number }>(
      `/events/${encodeURIComponent(String(eventId))}/attendees`,
      withOpts(query, options),
    );
  }

  slots(eventId: Id, options?: RequestOptions) {
    return this.http.get<{ items: PublicEventSlot[] }>(
      `/events/${encodeURIComponent(String(eventId))}/slots`,
      options,
    );
  }
}

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  search(
    query?: PaginationQuery & { q?: string },
    options?: RequestOptions,
  ) {
    return this.http.get<PublicUserSearchResponse>(
      "/users/search",
      withOpts(query, options),
    );
  }

  async *iterateSearch(
    query?: Omit<PaginationQuery, "page"> & { q?: string; maxPages?: number },
    options?: RequestOptions,
  ): AsyncGenerator<PublicUserSearchResponse["users"], void, unknown> {
    const { maxPages, ...rest } = query ?? {};
    yield* iteratePages(async (pageIndex) => {
      const res = await this.search(
        { ...rest, page: pageIndex + 1, limit: rest.limit ?? 12 },
        options,
      );
      const page = pageIndex + 1;
      const totalPages = res.pagination?.totalPages ?? 1;
      return {
        items: res.users ?? [],
        done: page >= totalPages || (res.users?.length ?? 0) === 0,
      };
    }, { maxPages });
  }

  async searchAll(
    query?: Omit<PaginationQuery, "page"> & {
      q?: string;
      maxPages?: number;
      maxItems?: number;
    },
    options?: RequestOptions,
  ) {
    return collectPages(
      async (pageIndex) => {
        const res = await this.search(
          { ...query, page: pageIndex + 1, limit: query?.limit ?? 12 },
          options,
        );
        const page = pageIndex + 1;
        const totalPages = res.pagination?.totalPages ?? 1;
        return {
          items: res.users ?? [],
          done: page >= totalPages || (res.users?.length ?? 0) === 0,
        };
      },
      { maxPages: query?.maxPages, maxItems: query?.maxItems },
    );
  }

  get(handleOrId: Id, options?: RequestOptions) {
    return this.http.get<PublicUserProfileResponse>(
      `/users/${encodeURIComponent(String(handleOrId))}`,
      options,
    );
  }

  getBySteam(steamId: string, options?: RequestOptions) {
    return this.http.get<PublicUserProfileResponse>(
      `/users/steam/${encodeURIComponent(steamId)}`,
      options,
    );
  }

  async resolve(
    handleOrIdOrSteam: string,
    options?: RequestOptions,
  ): Promise<PublicUser> {
    const res = await this.get(handleOrIdOrSteam, options);
    return res.user;
  }

  async batch(
    ids: Array<string | number> | string | number,
    ...rest: Array<string | number>
  ): Promise<PublicUserBatchResponse> {
    const list = normalizeIdList(ids, ...rest);
    const chunks = chunkIds(list, BATCH_MAX);
    const users: PublicUser[] = [];
    for (const chunk of chunks) {
      const res = await this.http.get<PublicUserBatchResponse>("/users/batch", {
        query: { ids: chunk.join(",") },
      });
      users.push(...(res.users ?? []));
    }
    return { users };
  }

  bans(userId: Id, options?: RequestOptions) {
    return this.http.get<PublicUserBans>(
      `/users/${encodeURIComponent(String(userId))}/bans`,
      options,
    );
  }

  events(userId: Id, query?: PaginationQuery & { tab?: string }, options?: RequestOptions) {
    return this.http.get<{ items: PublicEvent[]; total: number }>(
      `/users/${encodeURIComponent(String(userId))}/events`,
      withOpts(query, options),
    );
  }

  achievements(handleOrId: Id, options?: RequestOptions) {
    return this.http.get<PublicUserAchievements>(
      `/users/${encodeURIComponent(String(handleOrId))}/achievements`,
      options,
    );
  }
}

export class AchievementsResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.get<PublicAchievementsCatalog>("/achievements", options);
  }
}

export class NewsResource {
  constructor(private readonly http: HttpClient) {}

  list(query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get<CursorPage<PublicNewsItem> | { items?: PublicNewsItem[] }>(
      "/news",
      withOpts(query, options),
    );
  }

  get(id: Id, options?: RequestOptions) {
    return this.http.get<PublicNewsItem>(
      `/news/${encodeURIComponent(String(id))}`,
      options,
    );
  }
}

export class BansResource {
  constructor(private readonly http: HttpClient) {}

  list(
    query?: PaginationQuery & { q?: string; scope?: string; pageSize?: number },
    options?: RequestOptions,
  ) {
    return this.http.get<{
      data: PublicBanListItem[];
      total: number;
      page: number;
      pageSize: number;
    }>("/bans", withOpts(query, options));
  }

  async *iterate(
    query?: Omit<PaginationQuery, "page"> & {
      q?: string;
      scope?: string;
      pageSize?: number;
      maxPages?: number;
    },
    options?: RequestOptions,
  ): AsyncGenerator<PublicBanListItem[], void, unknown> {
    const { maxPages, pageSize, ...rest } = query ?? {};
    yield* iteratePages(async (pageIndex) => {
      const res = await this.list(
        {
          ...rest,
          page: pageIndex + 1,
          pageSize: pageSize ?? rest.limit ?? 25,
        },
        options,
      );
      const totalPages = Math.max(1, Math.ceil(res.total / res.pageSize));
      return {
        items: res.data ?? [],
        done: res.page >= totalPages || (res.data?.length ?? 0) === 0,
      };
    }, { maxPages });
  }

  get(id: Id, options?: RequestOptions) {
    return this.http.get<PublicBanDetail>(
      `/bans/${encodeURIComponent(String(id))}`,
      options,
    );
  }
}

export class MetaResource {
  constructor(private readonly http: HttpClient) {}

  session(options?: RequestOptions) {
    return this.http.get("/session", options);
  }

  status(options?: RequestOptions) {
    return this.http.get("/status", options);
  }

  version(options?: RequestOptions) {
    return this.http.get<PublicVersion>("/version", options);
  }

  rules(options?: RequestOptions) {
    return this.http.get<PublicRules>("/rules", options);
  }

  partners(options?: RequestOptions) {
    return this.http.get<{ partners?: PublicPartner[]; items?: PublicPartner[] } | PublicPartner[]>(
      "/partners",
      options,
    );
  }

  stats(options?: RequestOptions) {
    return this.http.get("/stats", options);
  }

  recruitmentOpen(options?: RequestOptions) {
    return this.http.get("/recruitment/open", options);
  }
}

export class ProgramsResource {
  constructor(private readonly http: HttpClient) {}

  badge(slug: string, options?: RequestOptions) {
    return this.http.get<PublicBadgeProgram>(
      `/programs/badges/${encodeURIComponent(slug)}`,
      options,
    );
  }

  recognition(options?: RequestOptions) {
    return this.http.get<PublicRecognitionPrograms>(
      "/programs/recognition",
      options,
    );
  }
}

export class GameResource {
  constructor(private readonly http: HttpClient) {}

  servers(options?: RequestOptions) {
    return this.http.get<{ servers?: GameServer[]; items?: GameServer[] } | GameServer[]>(
      "/game/servers",
      options,
    );
  }
}
