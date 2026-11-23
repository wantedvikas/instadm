import { logout } from "./actions";
import { RuleForm } from "./RuleForm";
import { listVideos, type Media } from "@/lib/ig";
import { currentAccount } from "@/lib/session";
import { getRules, type Rule } from "@/lib/store";

const DEFAULT_RULE: Rule = {
  enabled: false,
  keywords: "",
  replyText: "Hey {username}! Thanks for the comment 🙌 Tap the button below and I'll send it over.",
  linkMessage: "",
  followGate: true,
  followText: "Almost there! Please follow me first, then tap “I followed ✅” and I'll send the link 🙏",
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const { error } = await searchParams;
  const account = await currentAccount();

  if (!account) {
    return (
      <main className="center">
        <h1>InstaAutoDM</h1>
        <p>Auto-DM your promised links to people who comment on your reels.</p>
        {typeof error === "string" && <p className="err">{error}</p>}
        <a className="button" href="/api/auth/login">
          Connect Instagram
        </a>
      </main>
    );
  }

  let videos: Media[] = [];
  let loadError = "";
  try {
    videos = await listVideos(account.token);
  } catch (e) {
    console.error(e);
    loadError = "Could not load your videos. Try reconnecting Instagram.";
  }
  const rules = await getRules();

  return (
    <main>
      <header>
        <h1>InstaAutoDM</h1>
        <span>@{account.username}</span>
        <form action={logout}>
          <button className="link">Log out</button>
        </form>
      </header>

      {loadError && (
        <p className="err">
          {loadError} <a href="/api/auth/login">Reconnect</a>
        </p>
      )}
      {!loadError && videos.length === 0 && <p>No videos found on this account.</p>}

      <div className="grid">
        {videos.map((v) => {
          const rule = { ...DEFAULT_RULE, ...rules[v.id] };
          return (
            <article key={v.id} className={rule.enabled ? "card on" : "card"}>
              <a href={v.permalink} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URLs expire; no point optimizing */}
                <img src={v.thumbnail_url ?? v.media_url} alt={`Video posted ${v.timestamp.slice(0, 10)}`} />
              </a>
              <p className="meta">
                {new Date(v.timestamp).toLocaleDateString()} · {v.comments_count ?? 0} comments
                {rule.enabled && <strong> · Active</strong>}
              </p>
              <RuleForm mediaId={v.id} rule={rule} />
            </article>
          );
        })}
      </div>
    </main>
  );
}
