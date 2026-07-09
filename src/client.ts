import { HttpClient } from "./http.js";
import type { RequestOptions, TrucklineClientOptions } from "./types.js";
import {
  BansResource,
  EventsResource,
  GameResource,
  MetaResource,
  NewsResource,
  ProgramsResource,
  UsersResource,
  VtcsResource,
} from "./resources.js";

/**
 * Official TrucklineMP public API client.
 *
 * @example
 * ```ts
 * import { Truckline } from "@trucklinemp/sdk";
 *
 * const tl = new Truckline({
 *   apiKey: process.env.TRUCKLINE_API_KEY,
 *   environment: "production",
 * });
 *
 * const vtc = await tl.vtcs.get("my-vtc");
 * ```
 */
export class Truckline {
  private readonly http: HttpClient;

  readonly vtcs: VtcsResource;
  readonly events: EventsResource;
  readonly users: UsersResource;
  readonly news: NewsResource;
  readonly bans: BansResource;
  readonly meta: MetaResource;
  readonly programs: ProgramsResource;
  readonly game: GameResource;

  constructor(options: TrucklineClientOptions = {}) {
    this.http = new HttpClient(options);
    this.vtcs = new VtcsResource(this.http);
    this.events = new EventsResource(this.http);
    this.users = new UsersResource(this.http);
    this.news = new NewsResource(this.http);
    this.bans = new BansResource(this.http);
    this.meta = new MetaResource(this.http);
    this.programs = new ProgramsResource(this.http);
    this.game = new GameResource(this.http);
  }

  /** Base URL the client is using (no trailing slash). */
  get baseUrl(): string {
    return this.http.baseUrl;
  }

  /** Low-level escape hatch for paths not yet wrapped. */
  request<T = unknown>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    return this.http.request<T>(method, path, options);
  }

  get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.http.get<T>(path, options);
  }
}
