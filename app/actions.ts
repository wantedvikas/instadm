"use server";

import { redirect } from "next/navigation";
import { clearSession, currentAccount } from "@/lib/session";
import { setRule } from "@/lib/store";

// Instagram rejects DM text over 1000 characters.
const text = (f: FormData, key: string, max = 1000) => String(f.get(key) ?? "").trim().slice(0, max);

export type SaveState = { ok?: boolean; error?: string; at?: number };

export async function saveRule(_prev: SaveState, f: FormData): Promise<SaveState> {
  if (!(await currentAccount())) return { error: "Session expired, log in again" };

  const mediaId = text(f, "mediaId", 64);
  if (!/^\d+$/.test(mediaId)) return { error: "Invalid video" };

  const rule = {
    enabled: f.get("enabled") === "on",
    keywords: text(f, "keywords", 200),
    replyText: text(f, "replyText"),
    linkMessage: text(f, "linkMessage"),
    followGate: f.get("followGate") === "on",
    followText: text(f, "followText"),
  };
  if (rule.enabled && (!rule.replyText || !rule.linkMessage)) return { error: "Fill in the reply and the link message" };
  if (rule.enabled && rule.followGate && !rule.followText) return { error: "Fill in the follow-first message" };

  await setRule(mediaId, rule);
  return { ok: true, at: Date.now() };
}

export async function logout() {
  await clearSession();
  redirect("/");
}
