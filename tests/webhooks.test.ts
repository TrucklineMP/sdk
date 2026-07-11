import { describe, expect, it } from "vitest";
import {
  createWebhookHandler,
  getWebhookDeliveryId,
  getWebhookEventType,
  getWebhookSignature,
  isWebhookEventType,
  parseWebhookBody,
  signWebhookPayload,
  verifyWebhookSignature,
  WEBHOOK_DELIVERY_HEADER,
  WEBHOOK_EVENT_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
} from "../src/webhooks.js";

describe("webhooks", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ type: "user.banned", data: { userId: "u1" } });

  it("signs and verifies", () => {
    const sig = signWebhookPayload(body, secret);
    expect(sig.startsWith("sha256=")).toBe(true);
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(body, "sha256=deadbeef", secret)).toBe(false);
  });

  it("createWebhookHandler accepts valid delivery", async () => {
    const sig = signWebhookPayload(body, secret);
    let seenType: string | null = null;
    const handle = createWebhookHandler({
      secret,
      onEvent: async (_event, meta) => {
        seenType = meta.type;
      },
    });
    const result = await handle({
      rawBody: body,
      headers: {
        [WEBHOOK_SIGNATURE_HEADER]: sig,
        "x-trucklinemp-event": "user.banned",
      },
    });
    expect(result).toEqual({ ok: true });
    expect(seenType).toBe("user.banned");
  });

  it("createWebhookHandler rejects bad signature", async () => {
    const handle = createWebhookHandler({
      secret,
      onEvent: async () => {},
    });
    const result = await handle({
      rawBody: body,
      headers: { [WEBHOOK_SIGNATURE_HEADER]: "sha256=nope" },
    });
    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("createWebhookHandler rejects invalid json", async () => {
    const raw = "not-json";
    const sig = signWebhookPayload(raw, secret);
    const handle = createWebhookHandler({
      secret,
      onEvent: async () => {},
    });
    const result = await handle({
      rawBody: raw,
      headers: { [WEBHOOK_SIGNATURE_HEADER]: sig },
    });
    expect(result).toEqual({ ok: false, reason: "invalid_json" });
  });

  it("parses webhook body and reads headers", () => {
    const parsed = parseWebhookBody(body);
    expect(parsed.type).toBe("user.banned");

    const headers = {
      [WEBHOOK_SIGNATURE_HEADER]: "sha256=abc",
      [WEBHOOK_EVENT_HEADER]: "user.banned",
      [WEBHOOK_DELIVERY_HEADER]: "del-1",
    };
    expect(getWebhookSignature(headers)).toBe("sha256=abc");
    expect(getWebhookEventType(headers)).toBe("user.banned");
    expect(getWebhookDeliveryId(headers)).toBe("del-1");
    expect(isWebhookEventType("user.banned", "user.banned")).toBe(true);
    expect(isWebhookEventType("user.updated", "user.banned")).toBe(false);
  });
});
