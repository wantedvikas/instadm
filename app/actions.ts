"use server";

import { timingSafeEqual, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getInstagramAccount, subscribeWebhooks } from "@/lib/ig";
import { clearSession, isLoggedIn, setSession } from "@/lib/session";
import { setAccount, setRule } from "@/lib/store";

// Instagram rejects DM text over 1000 characters.
const text = (f: FormData, key: string, max = 1000) => String(f.get(key) ?? "").trim().slice(0, max);
const hash = (s: string) => createHash("sha256").update(s).digest();

export type FormState = { ok?: boolean; error?: string; at?: number };

export async function login(_prev: FormState, f: FormData): Promise<FormState> {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return { error: "DASHBOARD_PASSWORD is not set on the server" };
  // Hash both sides so the comparison is constant-time regardless of length.
  if (!timingSafeEqual(hash(String(f.get("password") ?? "")), hash(expected))) return { error: "Wrong password" };
  await setSession();
  redirect("/");
}

/** Reads the IG account behind IG_ACCESS_TOKEN and subscribes it to webhooks. Safe to run again after changing the token. */
export async function connect(): Promise<FormState> {
  if (!(await isLoggedIn())) return { error: "Session expired, log in again" };
  try {
    const account = await getInstagramAccount();
    await subscribeWebhooks(account.igId);
    await setAccount(account);
  } catch (e) {
    console.error("Connect failed:", e);
    return { error: e instanceof Error ? e.message : "Could not reach Instagram" };
  }
  revalidatePath("/");
  return { ok: true, at: Date.now() };
}

export async function saveRule(_prev: FormState, f: FormData): Promise<FormState> {
  if (!(await isLoggedIn())) return { error: "Session expired, log in again" };

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
  // React resets <form action> fields after submit; re-rendering with the saved rule makes the reset show the new values.
  revalidatePath("/");
  return { ok: true, at: Date.now() };
}

export async function logout() {
  await clearSession();
  redirect("/");
}
