import { HttpClient } from "./http.js";
import type { RateLimitInfo, RequestOptions, TrucklineClientOptions } from "./types.js";
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
import { SDK_VERSION } from "./version.js";

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

  static readonly VERSION = SDK_VERSION;

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

  get baseUrl(): string {
    return this.http.baseUrl;
  }

  get version(): string {
    return SDK_VERSION;
  }

  get lastRateLimit(): RateLimitInfo | null {
    return this.http.lastRateLimit;
  }

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

  post<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.http.post<T>(path, options);
  }
}
