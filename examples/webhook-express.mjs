import express from "express";
import {
  createWebhookHandler,
  WEBHOOK_SIGNATURE_HEADER,
} from "../dist/webhooks-entry.js";

const app = express();
const secret = process.env.WEBHOOK_SECRET ?? "replace-me";

const handle = createWebhookHandler({
  secret,
  onEvent: async (event, meta) => {
    console.log("event", meta.type, meta.deliveryId, event);
  },
});

app.post(
  "/webhooks/truckline",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(String(req.body ?? ""), "utf8");
    const result = await handle({
      rawBody,
      headers: req.headers,
    });
    if (!result.ok) {
      res.status(401).json(result);
      return;
    }
    res.status(200).json({ ok: true });
  },
);

app.listen(8787, () => {
  console.log(`listening; expect header ${WEBHOOK_SIGNATURE_HEADER}`);
});
