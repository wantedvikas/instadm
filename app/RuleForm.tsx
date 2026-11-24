"use client";

import { useActionState, useState } from "react";
import { saveRule, type FormState } from "./actions";
import type { Rule } from "@/lib/store";

export function RuleForm({ mediaId, rule, username }: { mediaId: string; rule: Rule; username: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveRule, {});
  // Mirrors the fields the preview shows; inputs stay uncontrolled so React's post-submit reset keeps working.
  const [draft, setDraft] = useState(rule);
  const set = (k: keyof Rule) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div className="editor">
      <form action={action} className="rule panel">
        <input type="hidden" name="mediaId" value={mediaId} />

        <label className="toggle">
          <input type="checkbox" name="enabled" defaultChecked={rule.enabled} />
          Active: DM people who comment on this reel
        </label>

        <label>
          Trigger keywords <span className="hint">Comma-separated. Leave empty to reply to every comment.</span>
          <input name="keywords" defaultValue={rule.keywords} onChange={set("keywords")} placeholder="link, repo, code" />
        </label>

        <label>
          First DM <span className="hint">{"{username}"} becomes their name.</span>
          <textarea name="replyText" rows={2} defaultValue={rule.replyText} onChange={set("replyText")} />
        </label>

        <label>
          Link message <span className="hint">What you promised in the reel.</span>
          <textarea name="linkMessage" rows={3} defaultValue={rule.linkMessage} onChange={set("linkMessage")} placeholder="Here you go: https://github.com/..." />
        </label>

        <label className="toggle">
          <input type="checkbox" name="followGate" defaultChecked={rule.followGate} onChange={set("followGate")} />
          Only send the link to followers
        </label>

        {draft.followGate ? (
          <label>
            Follow-first message <span className="hint">Sent to non-followers with an “I followed ✅” button.</span>
            <textarea name="followText" rows={2} defaultValue={draft.followText} onChange={set("followText")} />
          </label>
        ) : (
          <input type="hidden" name="followText" value={draft.followText} />
        )}

        <div className="row">
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Saving…" : "Save automation"}
          </button>
          <span role="status" className={state.error ? "err" : "ok"}>
            {state.error ?? (state.ok ? "Saved ✓" : "")}
          </span>
        </div>
      </form>

      <Preview rule={draft} username={username} />
    </div>
  );
}

/** What a commenter sees in their Instagram inbox, updated as you type. */
function Preview({ rule, username }: { rule: Rule; username: string }) {
  const name = "sam";
  const greeting = rule.replyText.replaceAll("{username}", name).trim();
  const link = rule.linkMessage.trim() || "Your link appears here";
  const keyword = rule.keywords.split(",")[0]?.trim() || "link please 🙏";

  return (
    <aside className="phone" aria-label="DM preview">
      <div className="phone-head">
        <span className="avatar sm">{username[0]?.toUpperCase()}</span>@{username}
      </div>
      <div className="phone-note">@{name} commented “{keyword}” on your reel</div>
      {rule.followGate ? (
        <>
          <div className="msg them">{greeting}</div>
          <span className="quick">Send me the link</span>
          <div className="msg me">Send me the link</div>
          <div className="msg them">{rule.followText}</div>
          <span className="quick">I followed ✅</span>
          <div className="phone-note">after they follow and tap</div>
          <div className="msg them">{link}</div>
        </>
      ) : (
        <div className="msg them">{[greeting, link].filter(Boolean).join("\n\n")}</div>
      )}
    </aside>
  );
}
