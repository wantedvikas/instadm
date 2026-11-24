import { listVideos, type Media } from "@/lib/ig";
import { getAccount, getEvents, getRules } from "@/lib/store";
import { summarize } from "@/lib/util";

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
