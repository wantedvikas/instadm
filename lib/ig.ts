// Instagram API with Facebook Login: graph.facebook.com + a Page access token for the Page linked to the IG account.
// With a Page token, /me is the Page; DMs and webhook subscriptions go through it.
const GRAPH = "https://graph.facebook.com/v27.0";

const token = () => process.env.IG_ACCESS_TOKEN!;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${path}${sep}access_token=${encodeURIComponent(token())}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`Instagram API ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  return body as T;
}

export async function getInstagramAccount() {
  const r = await call<{ id: string; instagram_business_account?: { id: string; username: string } }>(
    "/me?fields=id,instagram_business_account{id,username}",
  );
  const ig = r.instagram_business_account;
  if (!ig) throw new Error("IG_ACCESS_TOKEN must be a Page token for a Page linked to your Instagram account");
  return { igId: ig.id, username: ig.username };
}

// The Page subscription is what makes Meta deliver Instagram DM webhooks for its linked account.
export const subscribeWebhooks = () =>
  call("/me/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed", { method: "POST" });

export type Media = {
  id: string;
  media_type: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink: string;
  timestamp: string;
  comments_count?: number;
  caption?: string;
};

/** All videos/reels, newest first. */
export async function listVideos(igId: string) {
  const out: Media[] = [];
  let after = "";
  // shortcut: stops at 500 posts; add a "load more" if the account grows past that.
  for (let page = 0; page < 10; page++) {
    const r = await call<{ data: Media[]; paging?: { cursors?: { after?: string }; next?: string } }>(
      `/${igId}/media?fields=id,media_type,thumbnail_url,media_url,permalink,timestamp,comments_count,caption&limit=50${
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

// igId is kept for logging/compat; the Page token sends as the Page-linked Instagram account.
function sendMessage(_igId: string, recipient: object, text: string, quickReplies?: QuickReply[]) {
  return call("/me/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient, message: quickReplies ? { text, quick_replies: quickReplies } : { text } }),
  });
}

export const sendDM = (igId: string, igsid: string, text: string, quickReplies?: QuickReply[]) =>
  sendMessage(igId, { id: igsid }, text, quickReplies);

/** Public reply under a comment (needs instagram_manage_comments). */
export const replyToComment = (commentId: string, message: string) =>
  call(`/${commentId}/replies?message=${encodeURIComponent(message)}`, { method: "POST" });

export const sendPrivateText = (igId: string, commentId: string, text: string) =>
  sendMessage(igId, { comment_id: commentId }, text);

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
