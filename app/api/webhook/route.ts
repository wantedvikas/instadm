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
  // Instagram Login apps sign with the Instagram app secret; Meta app secret accepted too in case Meta signs with that.
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"), [process.env.IG_APP_SECRET, process.env.META_APP_SECRET])) {
    return new Response("Bad signature", { status: 401 });
  }
  // Work finishes before we respond: serverless functions stop once the response is sent.
  await handleWebhook(JSON.parse(raw));
  return new Response("OK", { status: 200 });
}
