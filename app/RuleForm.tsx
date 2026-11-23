"use client";

import { useActionState } from "react";
import { saveRule, type SaveState } from "./actions";
import type { Rule } from "@/lib/store";

export function RuleForm({ mediaId, rule }: { mediaId: string; rule: Rule }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveRule, {});

  return (
    <form action={action} className="rule">
      <input type="hidden" name="mediaId" value={mediaId} />

      <label className="toggle">
        <input type="checkbox" name="enabled" defaultChecked={rule.enabled} />
        Auto-DM commenters on this video
      </label>

      <label>
        Trigger keywords <span className="hint">comma-separated, empty = every comment</span>
        <input name="keywords" defaultValue={rule.keywords} placeholder="link, repo, code" />
      </label>

      <label>
        First DM <span className="hint">{"{username}"} is replaced; a &quot;Send me the link&quot; button is added</span>
        <textarea name="replyText" rows={2} defaultValue={rule.replyText} />
      </label>

      <label>
        Link message <span className="hint">what you promised in the video</span>
        <textarea name="linkMessage" rows={3} defaultValue={rule.linkMessage} placeholder="Here you go: https://github.com/..." />
      </label>

      <label className="toggle">
        <input type="checkbox" name="followGate" defaultChecked={rule.followGate} />
        Only send the link to followers
      </label>

      <label>
        Follow-first message <span className="hint">an &quot;I followed ✅&quot; button is added</span>
        <textarea name="followText" rows={2} defaultValue={rule.followText} />
      </label>

      <div className="row">
        <button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <span role="status" className={state.error ? "err" : "ok"}>
          {state.error ?? (state.ok ? "Saved ✓" : "")}
        </span>
      </div>
    </form>
  );
}
