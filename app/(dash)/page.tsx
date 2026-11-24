import Link from "next/link";
import { dmsPerDay, loadDashboard } from "../data";
import { Stat, StatusBadge, Thumb, ago } from "../ui";

export default async function Home() {
  const { account, automations } = await loadDashboard();

  const active = automations.filter((a) => a.rule.enabled).length;
  const sum = (k: "comments" | "dmsSent" | "linksDelivered") => automations.reduce((n, a) => n + a.stats[k], 0);
  const people = automations.reduce((n, a) => n + a.stats.rows.length, 0);
  const links = sum("linksDelivered");
  const days = dmsPerDay(automations.flatMap((a) => a.events));
  const max = Math.max(1, ...days.map((d) => d.count));
  const recent = automations
    .flatMap((a) => a.stats.rows.map((r) => ({ ...r, mediaId: a.mediaId, media: a.media })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Hello, @{account.username}</h1>
          <p className="muted">Here&apos;s how your comment-to-DM automations are doing.</p>
        </div>
      </header>

      <section className="cards">
        <div className="card">
          <span className="muted">Instagram</span>
          <strong>Connected</strong>
          <span className="badge good">● @{account.username}</span>
        </div>
        <div className="card">
          <span className="muted">Get started</span>
          <strong>Create an automation</strong>
          <Link href="/automations/new" className="button">
            + New automation
          </Link>
        </div>
        <div className="card">
          <span className="muted">Automations</span>
          <strong>{active} active</strong>
          <Link href="/automations" className="button ghost">
            Manage
          </Link>
        </div>
      </section>

      <section className="stats">
        <Stat label="Comments" value={sum("comments")} />
        <Stat label="DMs sent" value={sum("dmsSent")} />
        <Stat label="Links delivered" value={links} />
        <Stat label="Conversion" value={people ? `${Math.round((links / people) * 100)}%` : "–"} />
      </section>

      <section className="panel">
        <h2>Activity</h2>
        <p className="muted">DMs sent, last 7 days</p>
        <div className="chart" role="img" aria-label={days.map((d) => `${d.day.toDateString()}: ${d.count} DMs`).join(", ")}>
          {days.map((d) => (
            <div key={d.day.getTime()} className="bar-col">
              <span className="bar-value">{d.count || ""}</span>
              <div className="bar" style={{ height: `${(d.count / max) * 100}%` }} />
              <span className="bar-label">{d.day.toLocaleDateString(undefined, { weekday: "short" })}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Recent activity</h2>
        {recent.length === 0 ? (
          <p className="muted">
            No comments on automated videos yet. <Link href="/automations/new">Create your first automation</Link>.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Commenter</th>
                <th>Comment</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={`${r.mediaId}-${r.igsid}`}>
                  <td>
                    <Link href={`/automations/${r.mediaId}`}>
                      <Thumb media={r.media} size={32} />
                    </Link>
                  </td>
                  <td>{r.username ? `@${r.username}` : "–"}</td>
                  <td className="clip">{r.text || "–"}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="muted">{ago(r.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
