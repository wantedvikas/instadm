import Link from "next/link";
import { loadDashboard } from "../../data";
import { DeleteButton } from "../../Forms";
import { Thumb } from "../../ui";

export default async function AutomationsPage() {
  const { automations } = await loadDashboard();

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Automations</h1>
          <p className="muted">Each automation DMs people who comment on one video.</p>
        </div>
        <Link href="/automations/new" className="button">
          + New automation
        </Link>
      </header>

      <section className="panel">
        {automations.length === 0 ? (
          <p className="muted">
            No automations yet. <Link href="/automations/new">Pick a video to automate</Link>.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Trigger</th>
                <th>Delivery</th>
                <th>Status</th>
                <th className="num">Comments</th>
                <th className="num">DMs</th>
                <th className="num">Links</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {automations.map((a) => (
                <tr key={a.mediaId}>
                  <td>
                    <Link href={`/automations/${a.mediaId}`} className="video-cell">
                      <Thumb media={a.media} size={36} />
                      <span>{a.media ? new Date(a.media.timestamp).toLocaleDateString() : "Deleted video"}</span>
                    </Link>
                  </td>
                  <td className="clip">{a.rule.keywords || <span className="muted">Any comment</span>}</td>
                  <td>{a.rule.followGate ? "Followers only" : "Link in first DM"}</td>
                  <td>
                    <span className={`badge ${a.rule.enabled ? "good" : "muted"}`}>{a.rule.enabled ? "Active" : "Paused"}</span>
                  </td>
                  <td className="num">{a.stats.comments}</td>
                  <td className="num">{a.stats.dmsSent}</td>
                  <td className="num">{a.stats.linksDelivered}</td>
                  <td className="actions">
                    <Link href={`/automations/${a.mediaId}`} className="button ghost small">
                      Edit
                    </Link>
                    <DeleteButton mediaId={a.mediaId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
