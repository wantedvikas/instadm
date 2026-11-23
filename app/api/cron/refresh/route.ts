import { refreshToken } from "@/lib/ig";
import { getAccount, setAccount } from "@/lib/store";

// Vercel Cron calls this daily with "Authorization: Bearer $CRON_SECRET". Tokens last 60 days; refresh weekly.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const account = await getAccount();
  if (!account) return Response.json({ skipped: "no account" });
  if (Date.now() - account.tokenSetAt < 7 * 24 * 60 * 60 * 1000) return Response.json({ skipped: "fresh" });

  const token = await refreshToken(account.token);
  await setAccount({ ...account, token, tokenSetAt: Date.now() });
  return Response.json({ refreshed: true });
}
