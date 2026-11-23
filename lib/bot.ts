import { followsMe, sendDM, sendPrivateReply } from "./ig";
import { clearPending, firstTime, getAccount, getPending, getRule, setPending, type Account } from "./store";
import { matchesKeyword } from "./util";

// Quick-reply titles are cut at 20 characters.
const linkButton = (mediaId: string) => ({ content_type: "text" as const, title: "Send me the link", payload: `GET:${mediaId}` });
const followedButton = (mediaId: string) => ({ content_type: "text" as const, title: "I followed ✅", payload: `GET:${mediaId}` });

type CommentValue = {
  id?: string;
  comment_id?: string;
  text?: string;
  from?: { id: string; username?: string };
  media?: { id: string };
};

type MessagingEvent = {
  sender: { id: string };
  message?: { mid: string; text?: string; is_echo?: boolean; quick_reply?: { payload: string } };
  postback?: { mid: string; payload: string };
};

type WebhookBody = {
  object: string;
  entry?: { id: string; changes?: { field: string; value: CommentValue }[]; messaging?: MessagingEvent[] }[];
};

/** Step 1: someone comments on a selected video -> one private-reply DM with a "Send me the link" button. */
async function onComment(account: Account, v: CommentValue) {
  const commentId = v.id ?? v.comment_id; // Meta's examples use either key depending on login type
  const mediaId = v.media?.id;
  const from = v.from?.id;
  if (!commentId || !mediaId || !from) return console.log("Comment skipped: missing ids");
  if (from === account.igId) return console.log("Comment skipped: your own comment");

  const rule = await getRule(mediaId);
  if (!rule?.enabled) return console.log(`Comment skipped: auto-DM off for media ${mediaId}`);
  if (!matchesKeyword(v.text ?? "", rule.keywords)) return console.log("Comment skipped: no keyword match");
  if (!(await firstTime(`c:${commentId}`))) return console.log("Comment skipped: already handled");

  await setPending(from, mediaId);
  const text = rule.replyText.replaceAll("{username}", v.from?.username ?? "there");
  await sendPrivateReply(account.igId, commentId, text, linkButton(mediaId));
  console.log(`Private reply sent for comment ${commentId}`);
}

/** Step 2: they tap a button (or type anything) -> follow check -> link or "follow first". */
async function onMessage(account: Account, e: MessagingEvent) {
  const sender = e.sender?.id;
  const mid = e.message?.mid ?? e.postback?.mid;
  if (!sender || sender === account.igId || e.message?.is_echo || !mid) return; // our own outgoing messages
  if (!(await firstTime(`m:${mid}`))) return console.log("Message skipped: already handled");

  const payload = e.message?.quick_reply?.payload ?? e.postback?.payload ?? "";
  const mediaId = payload.startsWith("GET:") ? payload.slice(4) : await getPending(sender);
  if (!mediaId) return console.log("Message skipped: not part of an auto-DM flow");

  const rule = await getRule(mediaId);
  if (!rule) return console.log(`Message skipped: no rule for media ${mediaId}`);

  if (rule.followGate) {
    let follows = true;
    try {
      follows = await followsMe(sender);
    } catch (err) {
      // Fail open: a broken lookup should not trap people in a "follow first" loop.
      console.error("Follow check failed, sending link anyway:", err);
    }
    if (!follows) {
      await sendDM(account.igId, sender, rule.followText, [followedButton(mediaId)]);
      return console.log("Sent follow-first message");
    }
  }

  await sendDM(account.igId, sender, rule.linkMessage);
  await clearPending(sender);
  console.log("Sent link message");
}

export async function handleWebhook(body: WebhookBody) {
  if (body.object !== "instagram") return;
  const account = await getAccount();
  if (!account || !process.env.IG_ACCESS_TOKEN) return console.warn("Webhook ignored: Instagram not connected");

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      console.log(`Event: ${change.field}`);
      if (change.field !== "comments") continue;
      try {
        await onComment(account, change.value);
      } catch (err) {
        console.error("Comment handling failed:", err);
      }
    }
    for (const event of entry.messaging ?? []) {
      console.log(`Event: ${event.postback ? "postback" : event.message?.quick_reply ? "quick reply" : event.message?.is_echo ? "echo" : "message"}`);
      try {
        await onMessage(account, event);
      } catch (err) {
        console.error("Message handling failed:", err);
      }
    }
  }
}
