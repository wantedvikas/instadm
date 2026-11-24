import { Redis } from "@upstash/redis";
import type { DmEvent } from "./util";

// Vercel's Upstash integration sets KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*.
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const WEEK = 7 * 24 * 60 * 60;

export type Account = { igId: string; username: string };

export type Rule = {
  enabled: boolean;
  keywords: string; // comma-separated, empty = any comment
  replyText: string; // first DM sent as a reply to the comment
  linkMessage: string; // the promised link / repo / code
  followGate: boolean;
  followText: string; // sent when follow gate is on and they don't follow yet
  publicReply?: string; // replies posted under the comment, one per line (random pick); empty = off; missing on older rules
};

export const getAccount = () => redis.get<Account>("account");
export const setAccount = (a: Account) => redis.set("account", a);

export const DEFAULT_RULE: Rule = {
  enabled: true,
  keywords: "",
  replyText: "Hey {username}! Thanks for the comment 🙌 Here's what I promised:",
  linkMessage: "",
  followGate: false,
  followText: "Almost there! Please follow me first, then tap “I followed ✅” and I'll send the link 🙏",
  publicReply: "Sent you a DM 📩\nCheck your DMs 🔥\nJust sent it to you! Check message requests if you don't see it 📬",
};

export const getRules = async () => (await redis.hgetall<Record<string, Rule>>("rules")) ?? {};
export const getRule = (mediaId: string) => redis.hget<Rule>("rules", mediaId);
export const setRule = (mediaId: string, rule: Rule) => redis.hset("rules", { [mediaId]: rule });
export const deleteRule = (mediaId: string) => Promise.all([redis.hdel("rules", mediaId), redis.del(`events:${mediaId}`)]);

// shortcut: keeps the latest 1000 events per video; move to a real database if videos get more comments than that.
export async function logEvent(mediaId: string, e: DmEvent) {
  await redis.lpush(`events:${mediaId}`, e);
  await redis.ltrim(`events:${mediaId}`, 0, 999);
}
export const getEvents = async (mediaId: string) => (await redis.lrange<DmEvent>(`events:${mediaId}`, 0, 999)) ?? [];

// shortcut: one pending video per commenter (latest comment wins); store a list if people often comment on several videos at once.
export const setPending = (igsid: string, mediaId: string) => redis.set(`pending:${igsid}`, mediaId, { ex: WEEK });
export const getPending = (igsid: string) => redis.get<string>(`pending:${igsid}`);
export const clearPending = (igsid: string) => redis.del(`pending:${igsid}`);

/** True the first time an id is seen (Meta can redeliver webhooks). */
export const firstTime = async (id: string) => (await redis.set(`seen:${id}`, 1, { nx: true, ex: WEEK })) === "OK";
