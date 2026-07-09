import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Build the signature header value for a raw webhook body.
 * Matches Truckline: `sha256=<hex hmac of body with secret>`.
 */
export function signWebhookPayload(rawBody: string | Buffer, secret: string): string {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${digest}`;
}

/**
 * Verify `X-Truckline-Signature` (or equivalent) against the raw request body.
 * Pass the **raw** body string/buffer, not a re-serialized JSON object.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = signWebhookPayload(rawBody, secret);
  try {
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
