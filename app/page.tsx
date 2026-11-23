import { logout } from "./actions";
import { ConnectButton, LoginForm } from "./Forms";
import { RuleForm } from "./RuleForm";
import { listVideos, type Media } from "@/lib/ig";
import { isLoggedIn } from "@/lib/session";
import { getAccount, getRules, type Rule } from "@/lib/store";

const DEFAULT_RULE: Rule = {
  enabled: false,
  keywords: "",
  replyText: "Hey {username}! Thanks for the comment 🙌 Tap the button below and I'll send it over.",
  linkMessage: "",
  followGate: true,
  followText: "Almost there! Please follow me first, then tap “I followed ✅” and I'll send the link 🙏",
};

export default async function Home() {
  if (!(await isLoggedIn())) {
    return (
      <main className="center">
        <h1>InstaAutoDM</h1>
        <p>Auto-DM your promised links to people who comment on your reels.</p>
        <LoginForm />
      </main>
    );
  }

  const account = await getAccount();
  if (!account) {
    return (
      <main className="center">
        <h1>InstaAutoDM</h1>
        <p>Connect the Instagram account behind IG_ACCESS_TOKEN and subscribe it to webhooks.</p>
        <ConnectButton label="Connect Instagram" />
      </main>
    );
  }

  let videos: Media[] = [];
  let loadError = "";
  try {
    videos = await listVideos(account.igId);
  } catch (e) {
    console.error(e);
    loadError = "Could not load your videos. Check IG_ACCESS_TOKEN, then reconnect.";
  }
  const rules = await getRules();

  return (
    <main>
      <header>
        <h1>InstaAutoDM</h1>
        <span>@{account.username}</span>
        <ConnectButton label="Reconnect" />
        <form action={logout}>
          <button className="link">Log out</button>
        </form>
      </header>

      {loadError && <p className="err">{loadError}</p>}
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
