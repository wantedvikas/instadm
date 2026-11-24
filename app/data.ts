import { listVideos, type Media } from "@/lib/ig";
import { getAccount, getEvents, getRules } from "@/lib/store";
import { summarize, type DmEvent } from "@/lib/util";

/** Everything the dashboard pages show: the account's videos and each automation with its analytics. */
export async function loadDashboard() {
  const account = (await getAccount())!; // the (dash) layout only renders pages once an account is connected
  let videos: Media[] = [];
  let videosError = false;
  try {
    videos = await listVideos(account.igId);
  } catch (e) {
    console.error("Could not load videos:", e);
    videosError = true;
  }
  const byId = new Map(videos.map((v) => [v.id, v]));
  const rules = await getRules();
  const automations = await Promise.all(
    Object.entries(rules).map(async ([mediaId, rule]) => {
      const events = await getEvents(mediaId);
      return { mediaId, rule, media: byId.get(mediaId), events, stats: summarize(events) };
    }),
  );
  automations.sort((a, b) => (b.media?.timestamp ?? "").localeCompare(a.media?.timestamp ?? ""));
  return { account, videos, videosError, automations };
}

/** DMs sent per day for the last `days` days (oldest first), for the Home chart. */
export function dmsPerDay(events: DmEvent[], days = 7) {
  const sent = new Set(["button_sent", "follow_asked", "link_sent"]);
  const out = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return { day: d, count: 0 };
  });
  for (const e of events) {
    if (!sent.has(e.status)) continue;
    const slot = out.findLast((o) => e.at >= o.day.getTime());
    if (slot && e.at < slot.day.getTime() + 86_400_000) slot.count++;
  }
  return out;
}
