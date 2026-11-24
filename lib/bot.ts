import { followsMe, sendDM, sendPrivateReply, sendPrivateText } from "./ig";
import { clearPending, firstTime, getAccount, getPending, getRule, logEvent, setPending, type Account } from "./store";
import { firstDm, matchesKeyword, type DmStatus } from "./util";

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
  if (!rule) return console.log(`Comment skipped: no automation for media ${mediaId}`);
  if (!(await firstTime(`c:${commentId}`))) return console.log("Comment skipped: already handled");

  // Every comment on an automated video is recorded, so the dashboard shows who commented and what they got.
  const log = (status: DmStatus) =>
    logEvent(mediaId, { at: Date.now(), igsid: from, username: v.from?.username, text: v.text ?? "", status });
  if (!rule.enabled) return log("paused");
  if (!matchesKeyword(v.text ?? "", rule.keywords)) return log("no_match");

  const dm = firstDm(rule, v.from?.username ?? "there");
  try {
    if (!dm.withButton) {
      await sendPrivateText(account.igId, commentId, dm.text);
      await log("link_sent");
      return console.log(`Link sent directly for comment ${commentId}`);
    }
    await setPending(from, mediaId);
    await sendPrivateReply(account.igId, commentId, dm.text, linkButton(mediaId));
    await log("button_sent");
    console.log(`Private reply with button sent for comment ${commentId}`);
  } catch (err) {
    await log("failed");
    throw err;
  }
}

/** Step 2: they tap a button (or type anything) -> follow check -> link or "follow first". */
async function onMessage(account: Account, e: MessagingEvent) {
  const sender = e.sender?.id;
  const mid = e.message?.mid ?? e.postback?.mid;
  if (e.message?.is_echo || sender === account.igId) return; // our own outgoing messages
  if (!sender || !mid) return console.log("Message skipped: missing sender or message id");
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
      await logEvent(mediaId, { at: Date.now(), igsid: sender, status: "follow_asked" });
      return console.log("Sent follow-first message");
    }
  }

  await sendDM(account.igId, sender, rule.linkMessage);
  await clearPending(sender);
  await logEvent(mediaId, { at: Date.now(), igsid: sender, status: "link_sent" });
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
