import type { HttpClient } from "./http.js";
import type { PaginationQuery, RequestOptions } from "./types.js";

type Id = string | number;

function withOpts(
  query?: Record<string, string | number | boolean | undefined | null>,
  options?: RequestOptions,
): RequestOptions {
  return { ...options, query: { ...options?.query, ...query } };
}

export class VtcsResource {
  constructor(private readonly http: HttpClient) {}

  list(query?: PaginationQuery & { q?: string }, options?: RequestOptions) {
    return this.http.get("/vtcs", withOpts(query, options));
  }

  batch(ids: Id[], options?: RequestOptions) {
    return this.http.get(
      "/vtcs/batch",
      withOpts({ ids: ids.join(",") }, options),
    );
  }

  get(idOrHandle: Id, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(idOrHandle))}`,
      options,
    );
  }

  members(idOrHandle: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(idOrHandle))}/members`,
      withOpts(query, options),
    );
  }

  news(id: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(id))}/news`,
      withOpts(query, options),
    );
  }

  events(id: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(id))}/events`,
      withOpts(query, options),
    );
  }

  roles(id: Id, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(id))}/roles`,
      options,
    );
  }

  gallery(id: Id, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(id))}/gallery`,
      options,
    );
  }

  tier(id: Id, options?: RequestOptions) {
    return this.http.get(
      `/vtcs/${encodeURIComponent(String(id))}/tier`,
      options,
    );
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
    return this.http.get("/events", withOpts(query, options));
  }

  get(eventId: Id, options?: RequestOptions) {
    return this.http.get(
      `/events/${encodeURIComponent(String(eventId))}`,
      options,
    );
  }

  attendees(eventId: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get(
      `/events/${encodeURIComponent(String(eventId))}/attendees`,
      withOpts(query, options),
    );
  }

  slots(eventId: Id, options?: RequestOptions) {
    return this.http.get(
      `/events/${encodeURIComponent(String(eventId))}/slots`,
      options,
    );
  }
}

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  search(query?: PaginationQuery & { q?: string }, options?: RequestOptions) {
    return this.http.get("/users/search", withOpts(query, options));
  }

  get(handleOrId: Id, options?: RequestOptions) {
    return this.http.get(
      `/users/${encodeURIComponent(String(handleOrId))}`,
      options,
    );
  }

  batch(ids: Id[], options?: RequestOptions) {
    return this.http.get(
      "/users/batch",
      withOpts({ ids: ids.join(",") }, options),
    );
  }

  bans(userId: Id, options?: RequestOptions) {
    return this.http.get(
      `/users/${encodeURIComponent(String(userId))}/bans`,
      options,
    );
  }

  events(userId: Id, query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get(
      `/users/${encodeURIComponent(String(userId))}/events`,
      withOpts(query, options),
    );
  }
}

export class NewsResource {
  constructor(private readonly http: HttpClient) {}

  list(query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get("/news", withOpts(query, options));
  }

  get(id: Id, options?: RequestOptions) {
    return this.http.get(`/news/${encodeURIComponent(String(id))}`, options);
  }
}

export class BansResource {
  constructor(private readonly http: HttpClient) {}

  list(query?: PaginationQuery, options?: RequestOptions) {
    return this.http.get("/bans", withOpts(query, options));
  }

  get(id: Id, options?: RequestOptions) {
    return this.http.get(`/bans/${encodeURIComponent(String(id))}`, options);
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
    return this.http.get("/version", options);
  }

  rules(options?: RequestOptions) {
    return this.http.get("/rules", options);
  }

  partners(options?: RequestOptions) {
    return this.http.get("/partners", options);
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
    return this.http.get(
      `/programs/badges/${encodeURIComponent(slug)}`,
      options,
    );
  }

  recognition(options?: RequestOptions) {
    return this.http.get("/programs/recognition", options);
  }
}

export class GameResource {
  constructor(private readonly http: HttpClient) {}

  servers(options?: RequestOptions) {
    return this.http.get("/game/servers", options);
  }
}
