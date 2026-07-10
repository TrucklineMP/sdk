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
  readonly causeError: unknown;

  constructor(opts: {
    message: string;
    status: number;
    code?: string;
    requestId?: string | null;
    details?: unknown;
    retryAfter?: number | null;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "TrucklineError";
    this.status = opts.status;
    this.code = opts.code ?? "ERROR";
    this.requestId = opts.requestId ?? null;
    this.details = opts.details;
    this.retryAfter = opts.retryAfter ?? null;
    this.causeError = opts.cause;
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

  get isTimeout(): boolean {
    return this.code === "TIMEOUT";
  }

  get isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR" || this.code === "TIMEOUT";
  }

  get isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  get isValidationError(): boolean {
    return this.status === 400 || this.code === "VALIDATION_ERROR";
  }
}
