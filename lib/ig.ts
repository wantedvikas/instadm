// Instagram API with Unified Login: graph.facebook.com + a system-user token generated in the Meta App Dashboard.
const GRAPH = "https://graph.facebook.com/v27.0";

const token = () => process.env.IG_ACCESS_TOKEN!;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${path}${sep}access_token=${encodeURIComponent(token())}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`Instagram API ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  return body as T;
}

/** With a system-user token, /me is the integration user; the IG account comes from assigned_instagram_accounts. */
export async function getInstagramAccount() {
  const r = await call<{ data: { id: string; username: string }[] }>("/me/assigned_instagram_accounts?fields=id,username");
  // shortcut: uses the first assigned account; add a picker if the token ever covers several accounts.
  const a = r.data[0];
  if (!a) throw new Error("This token has no Instagram account assigned");
  return { igId: a.id, username: a.username };
}

export const subscribeWebhooks = (igId: string) =>
  call(`/${igId}/subscribed_apps?subscribed_fields=comments,messages,messaging_postbacks`, { method: "POST" });

/** Permissions granted to IG_ACCESS_TOKEN (for the dashboard status line). Needs the Meta app ID + secret. */
export async function tokenScopes() {
  const appToken = `1177254798157533|${process.env.META_APP_SECRET}`;
  const res = await fetch(
    `${GRAPH}/debug_token?input_token=${encodeURIComponent(token())}&access_token=${encodeURIComponent(appToken)}`,
  );
  const body = await res.json().catch(() => ({}));
  return (body.data?.scopes as string[] | undefined) ?? [`unknown (${body.error?.message ?? res.status})`];
}

/** Which webhook fields Meta actually has on for this account (for the dashboard status line). */
export const subscribedFields = async (igId: string) =>
  (await call<{ data: { subscribed_fields?: string[] }[] }>(`/${igId}/subscribed_apps`)).data.flatMap(
    (a) => a.subscribed_fields ?? [],
  );

export type Media = {
  id: string;
  media_type: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink: string;
  timestamp: string;
  comments_count?: number;
};

/** All videos/reels, newest first. */
export async function listVideos(igId: string) {
  const out: Media[] = [];
  let after = "";
  // shortcut: stops at 500 posts; add a "load more" if the account grows past that.
  for (let page = 0; page < 10; page++) {
    const r = await call<{ data: Media[]; paging?: { cursors?: { after?: string }; next?: string } }>(
      `/${igId}/media?fields=id,media_type,thumbnail_url,media_url,permalink,timestamp,comments_count&limit=50${
        after ? `&after=${after}` : ""
      }`,
    );
    out.push(...r.data.filter((m) => m.media_type === "VIDEO"));
    after = r.paging?.cursors?.after ?? "";
    if (!r.paging?.next || !after) break;
  }
  return out;
}

type QuickReply = { content_type: "text"; title: string; payload: string };

function sendMessage(igId: string, recipient: object, text: string, quickReplies?: QuickReply[]) {
  return call(`/${igId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient, message: quickReplies ? { text, quick_replies: quickReplies } : { text } }),
  });
}

export const sendDM = (igId: string, igsid: string, text: string, quickReplies?: QuickReply[]) =>
  sendMessage(igId, { id: igsid }, text, quickReplies);

/** The one allowed DM in reply to a comment. Meta documents text only, so try with a button and fall back to plain text. */
export async function sendPrivateReply(igId: string, commentId: string, text: string, button: QuickReply) {
  try {
    await sendMessage(igId, { comment_id: commentId }, text, [button]);
  } catch (e) {
    console.warn("Private reply with button failed, retrying as text:", e);
    await sendMessage(igId, { comment_id: commentId }, text);
  }
}

/** Needs the user to have messaged us first (tapping our quick reply counts). */
export const followsMe = async (igsid: string) =>
  (await call<{ is_user_follow_business?: boolean }>(`/${igsid}?fields=is_user_follow_business`)).is_user_follow_business ===
  true;
