import Link from "next/link";
import { loadDashboard } from "../../../data";
import { Thumb } from "../../../ui";

export default async function NewAutomationPage() {
  const { videos, videosError, automations } = await loadDashboard();
  const automated = new Set(automations.map((a) => a.mediaId));

  return (
    <>
      <header className="page-head">
        <div>
          <div className="crumbs">
            <Link href="/automations">Automations</Link> / New
          </div>
          <h1>Pick a reel</h1>
          <p className="muted">Step 1 of 2: choose the reel whose commenters should get your link.</p>
        </div>
      </header>

      {videosError && <p className="err">Could not load your videos. Check IG_ACCESS_TOKEN, then click Reconnect.</p>}
      {!videosError && videos.length === 0 && <p className="muted">No videos found on this account.</p>}

      <div className="picker">
        {videos.map((v) => (
          <Link key={v.id} href={`/automations/${v.id}`} className="pick">
            <Thumb media={v} size={160} />
            <span className="pick-meta">
              {new Date(v.timestamp).toLocaleDateString()} · {v.comments_count ?? 0} comments
            </span>
            {automated.has(v.id) && <span className="badge good pick-badge">Automated · Edit</span>}
          </Link>
        ))}
      </div>
    </>
  );
}
