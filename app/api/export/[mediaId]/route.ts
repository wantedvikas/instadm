import { isLoggedIn } from "@/lib/session";
import { getEvents } from "@/lib/store";
import { summarize } from "@/lib/util";

const cell = (v: string) => `"${v.replaceAll('"', '""')}"`;

/** Commenters of one automated reel as CSV. */
export async function GET(_req: Request, ctx: RouteContext<"/api/export/[mediaId]">) {
  if (!(await isLoggedIn())) return new Response("Unauthorized", { status: 401 });
  const { mediaId } = await ctx.params;
  if (!/^\d+$/.test(mediaId)) return new Response("Bad request", { status: 400 });

  const { rows } = summarize(await getEvents(mediaId));
  const csv = [
    "username,comment,status,last_activity",
    ...rows.map((r) => [r.username ?? "", r.text ?? "", r.status, new Date(r.at).toISOString()].map(cell).join(",")),
  ].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commenters-${mediaId}.csv"`,
    },
  });
}
