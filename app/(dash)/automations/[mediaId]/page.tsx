import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "../../../data";
import { DeleteButton, PauseButton } from "../../../Forms";
import { Icon } from "../../../icons";
import { RuleForm } from "../../../RuleForm";
import { Avatar, Stat, StatusBadge, Thumb, ago } from "../../../ui";
import { DEFAULT_RULE } from "@/lib/store";

export default async function AutomationPage({ params }: PageProps<"/automations/[mediaId]">) {
  const { mediaId } = await params;
  if (!/^\d+$/.test(mediaId)) notFound();

  const { account, videos, automations } = await loadDashboard();
  const existing = automations.find((a) => a.mediaId === mediaId);
  const media = existing?.media ?? videos.find((v) => v.id === mediaId);
  const stats = existing?.stats;
  const people = stats?.rows.length ?? 0;

  return (
    <>
      <header className="page-head">
        <div className="video-cell">
          <Thumb media={media} size={60} />
          <div>
            <div className="crumbs">
              <Link href="/automations">Automations</Link> / {existing ? "Edit" : "New"}
            </div>
            <h1>{media ? `Reel from ${new Date(media.timestamp).toLocaleDateString()}` : `Reel ${mediaId}`}</h1>
            {media && (
              <a href={media.permalink} target="_blank" rel="noreferrer" className="item-sub">
                View on Instagram <Icon name="external" size={12} />
              </a>
            )}
          </div>
        </div>
        {existing && (
          <div className="actions">
            <span className={`badge ${existing.rule.enabled ? "good" : "muted"}`}>{existing.rule.enabled ? "Active" : "Paused"}</span>
            <PauseButton mediaId={mediaId} enabled={existing.rule.enabled} />
            <DeleteButton mediaId={mediaId} />
          </div>
        )}
      </header>

      {stats && (
        <section className="stat-strip">
          <Stat icon="chat" label="Comments" value={stats.comments} />
          <Stat icon="send" label="DMs sent" value={stats.dmsSent} />
          <Stat icon="link" label="Links delivered" value={stats.linksDelivered} />
          <Stat icon="trend" label="Conversion" value={people ? `${Math.round((stats.linksDelivered / people) * 100)}%` : "–"} />
        </section>
      )}

      <section>
        <div className="panel-head">
          <h2>{existing ? "Settings" : "Set up the DM"}</h2>
        </div>
        <RuleForm mediaId={mediaId} rule={existing ? { ...existing.rule, publicReply: existing.rule.publicReply ?? DEFAULT_RULE.publicReply } : DEFAULT_RULE} username={account.username} />
      </section>

      {existing && (
        <section className="panel">
          <div className="panel-head">
            <h2>Commenters</h2>
            {people > 0 && (
              <a href={`/api/export/${mediaId}`} className="button ghost small" download>
                <Icon name="download" size={15} />
                Export CSV
              </a>
            )}
          </div>
          {!stats || people === 0 ? (
            <p className="muted">No comments yet. Each new comment on this reel shows up here with what the bot sent.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Commenter</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rows.map((r) => (
                    <tr key={r.igsid}>
                      <td>
                        <div className="video-cell">
                          <Avatar name={r.username} small />
                          {r.username ? (
                            <a href={`https://instagram.com/${r.username}`} target="_blank" rel="noreferrer">
                              @{r.username}
                            </a>
                          ) : (
                            "–"
                          )}
                        </div>
                      </td>
                      <td className="clip">{r.text || "–"}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="muted">{ago(r.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
