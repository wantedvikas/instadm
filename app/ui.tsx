import type { Media } from "@/lib/ig";
import type { DmStatus } from "@/lib/util";

const STATUS: Record<DmStatus, [label: string, tone: string]> = {
  link_sent: ["Link sent", "good"],
  follow_asked: ["Asked to follow", "warn"],
  button_sent: ["DM sent, waiting for tap", "info"],
  failed: ["Failed", "bad"],
  no_match: ["No keyword", "muted"],
  paused: ["Paused", "muted"],
};

export const StatusBadge = ({ status }: { status: DmStatus }) => (
  <span className={`badge ${STATUS[status][1]}`}>{STATUS[status][0]}</span>
);

export const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="stat">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

/* eslint-disable @next/next/no-img-element -- Instagram CDN URLs expire; next/image would only cache dead links */
export const Thumb = ({ media, size = 48 }: { media?: Media; size?: number }) =>
  media ? (
    <img className="thumb" src={media.thumbnail_url ?? media.media_url} alt="" width={size} height={size * 1.33} />
  ) : (
    <span className="thumb" style={{ width: size, height: size * 1.33 }} />
  );
/* eslint-enable @next/next/no-img-element */

export const ago = (at: number) => {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return new Date(at).toLocaleDateString();
};
