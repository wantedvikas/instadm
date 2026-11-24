import Link from "next/link";
import { loadDashboard } from "../../data";
import { DeleteButton, PauseButton } from "../../Forms";
import { Icon } from "../../icons";
import { Thumb, reelTitle } from "../../ui";

export default async function AutomationsPage() {
  const { automations } = await loadDashboard();
  const active = automations.filter((a) => a.rule.enabled).length;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Automations</h1>
          <p className="muted">
            {automations.length} total · {active} active. Each one DMs people who comment on one reel.
          </p>
        </div>
        <Link href="/automations/new" className="button primary">
          <Icon name="plus" size={16} />
          New automation
        </Link>
      </header>

      <section className="panel">
        {automations.length === 0 ? (
          <p className="muted">
            No automations yet. <Link href="/automations/new">Pick a reel to automate</Link>.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reel</th>
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
                        <Thumb media={a.media} size={38} />
                        <div style={{ minWidth: 0 }}>
                          {reelTitle(a.media) && <strong className="item-title" style={{ display: "block", maxWidth: 240 }}>{reelTitle(a.media)}</strong>}
                          <div className={reelTitle(a.media) ? "item-sub" : undefined}>
                            {a.media ? new Date(a.media.timestamp).toLocaleDateString() : "Deleted reel"}
                          </div>
                        </div>
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
                    <td>
                      <div className="actions">
                        <PauseButton mediaId={a.mediaId} enabled={a.rule.enabled} />
                        <Link href={`/automations/${a.mediaId}`} className="button ghost small">
                          <Icon name="edit" size={15} />
                          Edit
                        </Link>
                        <DeleteButton mediaId={a.mediaId} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
