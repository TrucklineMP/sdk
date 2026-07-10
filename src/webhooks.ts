import { createHmac, timingSafeEqual } from "node:crypto";
import type { WebhookDelivery, WebhookEventType } from "./models.js";

export const WEBHOOK_SIGNATURE_HEADER = "x-trucklinemp-signature";
export const WEBHOOK_EVENT_HEADER = "x-trucklinemp-event";
export const WEBHOOK_DELIVERY_HEADER = "x-trucklinemp-delivery";

export function signWebhookPayload(
  rawBody: string | Buffer,
  secret: string,
): string {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${digest}`;
}

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = signWebhookPayload(rawBody, secret);
  const candidates = [signatureHeader.trim()];
  try {
    for (const candidate of candidates) {
      const a = Buffer.from(candidate);
      const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getWebhookSignature(
  headers: Headers | Record<string, string | string[] | undefined>,
): string | null {
  const value = getHeader(headers, WEBHOOK_SIGNATURE_HEADER);
  return value ?? null;
}

export function getWebhookEventType(
  headers: Headers | Record<string, string | string[] | undefined>,
): string | null {
  return getHeader(headers, WEBHOOK_EVENT_HEADER);
}

export function getWebhookDeliveryId(
  headers: Headers | Record<string, string | string[] | undefined>,
): string | null {
  return getHeader(headers, WEBHOOK_DELIVERY_HEADER);
}

function getHeader(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? (headers as Headers).get(name.toUpperCase());
  }
  const rec = headers as Record<string, string | string[] | undefined>;
  const key = Object.keys(rec).find((k) => k.toLowerCase() === name.toLowerCase());
  if (!key) return null;
  const v = rec[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function parseWebhookBody(rawBody: string | Buffer): WebhookDelivery {
  const text = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const data = JSON.parse(text) as WebhookDelivery;
  return data;
}

export function isWebhookEventType(
  value: string,
  type: WebhookEventType,
): boolean {
  return value === type;
}

export type WebhookHandlerOptions = {
  secret: string;
  onEvent: (event: WebhookDelivery, meta: {
    type: string | null;
    deliveryId: string | null;
    rawBody: string;
  }) => void | Promise<void>;
  onInvalidSignature?: (rawBody: string) => void | Promise<void>;
};

export function createWebhookHandler(options: WebhookHandlerOptions) {
  return async function handleWebhook(input: {
    rawBody: string | Buffer;
    headers: Headers | Record<string, string | string[] | undefined>;
  }): Promise<{ ok: true } | { ok: false; reason: "invalid_signature" | "invalid_json" }> {
    const raw =
      typeof input.rawBody === "string"
        ? input.rawBody
        : input.rawBody.toString("utf8");
    const signature = getWebhookSignature(input.headers);
    if (!verifyWebhookSignature(raw, signature, options.secret)) {
      await options.onInvalidSignature?.(raw);
      return { ok: false, reason: "invalid_signature" };
    }
    let event: WebhookDelivery;
    try {
      event = parseWebhookBody(raw);
    } catch {
      return { ok: false, reason: "invalid_json" };
    }
    const type =
      getWebhookEventType(input.headers) ??
      (typeof event.type === "string" ? event.type : null);
    const deliveryId = getWebhookDeliveryId(input.headers);
    await options.onEvent(event, { type, deliveryId, rawBody: raw });
    return { ok: true };
  };
}
