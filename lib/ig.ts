// Instagram API with Instagram Login (graph.instagram.com).
const GRAPH = "https://graph.instagram.com/v27.0";

export const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
].join(",");

export const redirectUri = () => `${process.env.APP_URL}/api/auth/callback`;

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`Instagram API ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  return body as T;
}

export function authorizeUrl(state: string) {
  const p = new URLSearchParams({
    client_id: process.env.IG_APP_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}

/** code -> long-lived (60 day) token. */
export async function exchangeCode(code: string) {
  const short = await call<{ access_token?: string; data?: { access_token: string }[] }>(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.IG_APP_ID!,
        client_secret: process.env.IG_APP_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: redirectUri(),
        code,
      }),
    },
  );
  // Docs show { data: [ {...} ] }, the live API returns a flat object; accept both.
  const shortToken = short.data?.[0]?.access_token ?? short.access_token!;
  const long = await call<{ access_token: string }>(
    `https://graph.instagram.com/access_token?${new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: process.env.IG_APP_SECRET!,
      access_token: shortToken,
    })}`,
  );
  return long.access_token;
}

export const refreshToken = async (token: string) =>
  (
    await call<{ access_token: string }>(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`,
    )
  ).access_token;

/** user_id here is the professional account id that webhooks use as entry.id. */
export const getMe = (token: string) =>
  call<{ user_id: string; username: string }>(`${GRAPH}/me?fields=user_id,username&access_token=${token}`);

export const subscribeWebhooks = (token: string) =>
  call(`${GRAPH}/me/subscribed_apps?subscribed_fields=comments,messages,messaging_postbacks&access_token=${token}`, {
    method: "POST",
  });

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
export async function listVideos(token: string) {
  const out: Media[] = [];
  let after = "";
  // shortcut: stops at 500 posts; add a "load more" if the account grows past that.
  for (let page = 0; page < 10; page++) {
    const r = await call<{ data: Media[]; paging?: { cursors?: { after?: string }; next?: string } }>(
      `${GRAPH}/me/media?fields=id,media_type,thumbnail_url,media_url,permalink,timestamp,comments_count&limit=50${
        after ? `&after=${after}` : ""
      }&access_token=${token}`,
    );
    out.push(...r.data.filter((m) => m.media_type === "VIDEO"));
    after = r.paging?.cursors?.after ?? "";
    if (!r.paging?.next || !after) break;
  }
  return out;
}

type QuickReply = { content_type: "text"; title: string; payload: string };

function sendMessage(token: string, recipient: object, text: string, quickReplies?: QuickReply[]) {
  return call(`${GRAPH}/me/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient, message: quickReplies ? { text, quick_replies: quickReplies } : { text } }),
  });
}

export const sendDM = (token: string, igsid: string, text: string, quickReplies?: QuickReply[]) =>
  sendMessage(token, { id: igsid }, text, quickReplies);

/** The one allowed DM in reply to a comment. Meta documents text only, so try with a button and fall back to plain text. */
export async function sendPrivateReply(token: string, commentId: string, text: string, button: QuickReply) {
  try {
    await sendMessage(token, { comment_id: commentId }, text, [button]);
  } catch (e) {
    console.warn("Private reply with button failed, retrying as text:", e);
    await sendMessage(token, { comment_id: commentId }, text);
  }
}

/** Needs the user to have messaged us first (tapping our quick reply counts). */
export const followsMe = async (token: string, igsid: string) =>
  (await call<{ is_user_follow_business?: boolean }>(`${GRAPH}/${igsid}?fields=is_user_follow_business&access_token=${token}`))
    .is_user_follow_business === true;
