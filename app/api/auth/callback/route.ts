import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, getMe, subscribeWebhooks } from "@/lib/ig";
import { getAccount, setAccount } from "@/lib/store";
import { setSession } from "@/lib/session";

const home = (msg?: string) =>
  NextResponse.redirect(`${process.env.APP_URL}/${msg ? `?error=${encodeURIComponent(msg)}` : ""}`);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const expected = jar.get("oauth_state")?.value;
  jar.delete("oauth_state");

  if (url.searchParams.get("error")) return home(url.searchParams.get("error_description") ?? "Login cancelled");
  // Instagram appends "#_" to the redirect; browsers drop the fragment, but strip it defensively.
  const code = url.searchParams.get("code")?.replace(/#_$/, "");
  if (!code || !expected || url.searchParams.get("state") !== expected) return home("Invalid login attempt, try again");

  try {
    const token = await exchangeCode(code);
    const me = await getMe(token);
    const existing = await getAccount();
    // Single-owner app: once an account is connected, nobody else can take it over.
    if (existing && existing.igId !== me.user_id) return home(`This app is already connected to @${existing.username}`);

    await setAccount({ igId: me.user_id, username: me.username, token, tokenSetAt: Date.now() });
    await subscribeWebhooks(token);
    await setSession(me.user_id);
    return home();
  } catch (e) {
    console.error("OAuth callback failed:", e);
    return home("Could not connect Instagram. Check the server logs.");
  }
}
