export type TrucklineErrorBody = {
  code?: string;
  message?: string;
  status?: number;
  requestId?: string;
  details?: unknown;
};

export class TrucklineError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details: unknown;
  readonly retryAfter: number | null;

  constructor(opts: {
    message: string;
    status: number;
    code?: string;
    requestId?: string | null;
    details?: unknown;
    retryAfter?: number | null;
  }) {
    super(opts.message);
    this.name = "TrucklineError";
    this.status = opts.status;
    this.code = opts.code ?? "ERROR";
    this.requestId = opts.requestId ?? null;
    this.details = opts.details;
    this.retryAfter = opts.retryAfter ?? null;
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.code === "RATE_LIMITED";
  }

  get isNotFound(): boolean {
    return this.status === 404 || this.code === "NOT_FOUND";
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.code === "UNAUTHORIZED";
  }

  get isForbidden(): boolean {
    return this.status === 403 || this.code === "FORBIDDEN";
  }
}
