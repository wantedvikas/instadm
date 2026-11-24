import Link from "next/link";
import { loadDashboard } from "../data";
import { Icon } from "../icons";
import { AreaChart, Avatar, Stat, StatusBadge, Thumb, ago, reelTitle } from "../ui";
import { change, daily } from "@/lib/util";

export default async function Home() {
  const { account, automations } = await loadDashboard();

  const events = automations.flatMap((a) => a.events);
  const twoWeeks = daily(events, 14);
  const [lastWeek, thisWeek] = [twoWeeks.slice(0, 7), twoWeeks.slice(7)];
  const total = (days: typeof twoWeeks, k: "comments" | "dms") => days.reduce((n, d) => n + d[k], 0);

  const comments = automations.reduce((n, a) => n + a.stats.comments, 0);
  const dms = automations.reduce((n, a) => n + a.stats.dmsSent, 0);
  const links = automations.reduce((n, a) => n + a.stats.linksDelivered, 0);
  const people = automations.reduce((n, a) => n + a.stats.rows.length, 0);
  const active = automations.filter((a) => a.rule.enabled).length;

  const top = [...automations]
    .sort((a, b) => b.stats.linksDelivered - a.stats.linksDelivered || b.stats.comments - a.stats.comments)
    .slice(0, 5);
  const recent = automations
    .flatMap((a) => a.stats.rows.map((r) => ({ ...r, mediaId: a.mediaId })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 6);

  return (
    <div className="home">
      <div className="home-main">
        <header className="page-head">
          <div>
            <h1>Hello, {account.username}</h1>
            <p className="muted">
              {active ? `${active} automation${active > 1 ? "s are" : " is"} sending your links.` : "Create an automation to start sending links."}
            </p>
          </div>
          <span className="chip">
            {new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            <Icon name="calendar" size={16} />
          </span>
        </header>

        <section className="stat-strip">
          <Stat icon="chat" label="Comments" value={comments} delta={change(total(thisWeek, "comments"), total(lastWeek, "comments"))} />
          <Stat icon="send" label="DMs sent" value={dms} delta={change(total(thisWeek, "dms"), total(lastWeek, "dms"))} />
          <Stat icon="link" label="Links delivered" value={links} />
          <Stat icon="trend" label="Conversion" value={people ? `${Math.round((links / people) * 100)}%` : "–"} />
        </section>

        <section className="panel flat">
          <div className="panel-head">
            <h2>Performance</h2>
            <div className="legend">
              <span><i style={{ background: "var(--accent-2)" }} />Comments</span>
              <span><i style={{ background: "var(--accent)" }} />DMs sent</span>
              <span className="chip">Last 7 days</span>
            </div>
          </div>
          <AreaChart days={thisWeek} />
        </section>

        <section className="panel flat">
          <div className="panel-head">
            <h2>Top automations</h2>
            <Link href="/automations" className="button ghost small">
              View all
            </Link>
          </div>
          {top.length === 0 ? (
            <p className="muted">
              No automations yet. <Link href="/automations/new">Create your first one</Link>.
            </p>
          ) : (
            <div className="list">
              {top.map((a) => {
                const rate = a.stats.rows.length ? Math.round((a.stats.linksDelivered / a.stats.rows.length) * 100) : 0;
                return (
                  <Link key={a.mediaId} href={`/automations/${a.mediaId}`} className="item">
                    <Thumb media={a.media} size={40} />
                    <div style={{ minWidth: 0 }}>
                      {reelTitle(a.media) && <div className="item-title">{reelTitle(a.media)}</div>}
                      <div className={reelTitle(a.media) ? "item-trigger" : "item-title"}>{a.rule.keywords ? `“${a.rule.keywords}”` : "Any comment"}</div>
                      <div className="item-sub">
                        {a.media ? new Date(a.media.timestamp).toLocaleDateString() : "Deleted video"} ·{" "}
                        {a.rule.followGate ? "Followers only" : "Link in first DM"}
                      </div>
                    </div>
                    <span className={`badge ${a.rule.enabled ? "good" : "muted"}`}>{a.rule.enabled ? "Active" : "Paused"}</span>
                    <span className="num hide-sm">{a.stats.linksDelivered} links</span>
                    <div className="meter hide-sm" title={`${rate}% of commenters got the link`}>
                      <span style={{ width: `${rate}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="aside">
        <div className="aside-title">Activity</div>
        {recent.length === 0 ? (
          <p className="muted" style={{ textAlign: "center" }}>
            New comments on automated reels show up here.
          </p>
        ) : (
          <div className="feed">
            {recent.map((r) => (
              <div key={`${r.mediaId}-${r.igsid}`} className="feed-item">
                <Avatar name={r.username} small />
                <div style={{ minWidth: 0 }}>
                  <div className="feed-top">
                    <span>{r.username ? `@${r.username}` : "Someone"}</span>
                    <time>{ago(r.at)}</time>
                  </div>
                  <Link href={`/automations/${r.mediaId}`} className="item-sub">
                    commented on your reel
                  </Link>
                  {r.text && <div className="bubble">{r.text}</div>}
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
