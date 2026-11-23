import { handleWebhook } from "@/lib/bot";
import { verifySignature } from "@/lib/util";

// Meta's one-time verification when you save the webhook URL in the App Dashboard.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  // Signed with the Meta app secret (App settings > Basic).
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"), [process.env.META_APP_SECRET])) {
    console.warn("Webhook rejected: bad signature", {
      hasHeader: !!req.headers.get("x-hub-signature-256"),
      secretLength: process.env.META_APP_SECRET?.length ?? 0,
    });
    return new Response("Bad signature", { status: 401 });
  }
  const body = JSON.parse(raw);
  console.log("Webhook received", body.object, raw.length, "bytes");
  // Work finishes before we respond: serverless functions stop once the response is sent.
  await handleWebhook(body);
  return new Response("OK", { status: 200 });
}
