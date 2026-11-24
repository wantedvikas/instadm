import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "../../../data";
import { DeleteButton } from "../../../Forms";
import { RuleForm } from "../../../RuleForm";
import { Stat, StatusBadge, Thumb, ago } from "../../../ui";
import { DEFAULT_RULE } from "@/lib/store";

export default async function AutomationPage({ params }: PageProps<"/automations/[mediaId]">) {
  const { mediaId } = await params;
  if (!/^\d+$/.test(mediaId)) notFound();

  const { videos, automations } = await loadDashboard();
  const existing = automations.find((a) => a.mediaId === mediaId);
  const media = existing?.media ?? videos.find((v) => v.id === mediaId);
  const stats = existing?.stats;
  const people = stats?.rows.length ?? 0;

  return (
    <>
      <header className="page-head">
        <div className="video-cell">
          <Thumb media={media} size={56} />
          <div>
            <p className="muted">
              <Link href="/automations">Automations</Link> / {existing ? "Edit" : "New"}
            </p>
            <h1>{media ? `Reel from ${new Date(media.timestamp).toLocaleDateString()}` : `Video ${mediaId}`}</h1>
            {media && (
              <a href={media.permalink} target="_blank" rel="noreferrer">
                View on Instagram ↗
              </a>
            )}
          </div>
        </div>
        {existing && <DeleteButton mediaId={mediaId} />}
      </header>

      {stats && (
        <section className="stats">
          <Stat label="Comments" value={stats.comments} />
          <Stat label="DMs sent" value={stats.dmsSent} />
          <Stat label="Links delivered" value={stats.linksDelivered} />
          <Stat label="Conversion" value={people ? `${Math.round((stats.linksDelivered / people) * 100)}%` : "–"} />
        </section>
      )}

      <div className="split">
        <section className="panel">
          <h2>{existing ? "Settings" : "Set up the DM"}</h2>
          <RuleForm mediaId={mediaId} rule={existing?.rule ?? DEFAULT_RULE} />
        </section>

        <section className="panel">
          <h2>Commenters</h2>
          {!stats || stats.rows.length === 0 ? (
            <p className="muted">
              {existing ? "No comments since this automation was created." : "Save the automation to start tracking comments."}
            </p>
          ) : (
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
                      {r.username ? (
                        <a href={`https://instagram.com/${r.username}`} target="_blank" rel="noreferrer">
                          @{r.username}
                        </a>
                      ) : (
                        "–"
                      )}
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
          )}
        </section>
      </div>
    </>
  );
}
