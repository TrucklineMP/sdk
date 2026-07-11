import { describe, expect, it } from "vitest";
import { TrucklineError } from "../src/errors.js";

describe("TrucklineError helpers", () => {
  it("detects rate limiting", () => {
    const err = new TrucklineError({
      message: "slow down",
      status: 429,
      code: "RATE_LIMITED",
    });
    expect(err.isRateLimited).toBe(true);
    expect(err.isNotFound).toBe(false);
  });

  it("detects not found", () => {
    const err = new TrucklineError({
      message: "missing",
      status: 404,
      code: "NOT_FOUND",
    });
    expect(err.isNotFound).toBe(true);
  });

  it("detects unauthorized and forbidden", () => {
    expect(
      new TrucklineError({ message: "x", status: 401, code: "UNAUTHORIZED" })
        .isUnauthorized,
    ).toBe(true);
    expect(
      new TrucklineError({ message: "x", status: 403, code: "FORBIDDEN" })
        .isForbidden,
    ).toBe(true);
  });

  it("detects timeout and network errors", () => {
    const timeout = new TrucklineError({
      message: "timed out",
      status: 0,
      code: "TIMEOUT",
    });
    expect(timeout.isTimeout).toBe(true);
    expect(timeout.isNetworkError).toBe(true);

    const network = new TrucklineError({
      message: "offline",
      status: 0,
      code: "NETWORK_ERROR",
    });
    expect(network.isNetworkError).toBe(true);
    expect(network.isTimeout).toBe(false);
  });

  it("detects server and validation errors", () => {
    const server = new TrucklineError({
      message: "boom",
      status: 503,
      code: "ERROR",
    });
    expect(server.isServerError).toBe(true);

    const validation = new TrucklineError({
      message: "bad input",
      status: 400,
      code: "VALIDATION_ERROR",
    });
    expect(validation.isValidationError).toBe(true);
  });
});
