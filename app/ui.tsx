import { Icon, type IconName } from "./icons";
import type { Media } from "@/lib/ig";
import type { DmStatus } from "@/lib/util";

const STATUS: Record<DmStatus, [label: string, tone: string]> = {
  link_sent: ["Link sent", "good"],
  follow_asked: ["Asked to follow", "warn"],
  button_sent: ["Waiting for tap", "info"],
  failed: ["Failed", "bad"],
  no_match: ["No keyword", "muted"],
  paused: ["Paused", "muted"],
};

export const StatusBadge = ({ status }: { status: DmStatus }) => (
  <span className={`badge ${STATUS[status][1]}`}>{STATUS[status][0]}</span>
);

/** Stat tile: icon, label, value and a week-over-week change (null = nothing to compare). */
export const Stat = ({ icon, label, value, delta }: { icon: IconName; label: string; value: string | number; delta?: number | null }) => (
  <div className="stat">
    <span className="stat-icon">
      <Icon name={icon} size={20} />
    </span>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        <strong>{value}</strong>
        {delta != null && (
          <span className={`delta ${delta >= 0 ? "up" : "down"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last week
          </span>
        )}
      </div>
    </div>
  </div>
);

export const Avatar = ({ name, small }: { name?: string; small?: boolean }) => (
  <span className={small ? "avatar sm" : "avatar"}>{(name ?? "?")[0]?.toUpperCase()}</span>
);

/** First line of the reel's caption, used as its title. */
export const reelTitle = (media?: Media) => media?.caption?.trim().split("\n")[0].trim() || undefined;

/* eslint-disable @next/next/no-img-element -- Instagram CDN URLs expire; next/image would only cache dead links */
export const Thumb = ({ media, size = 48 }: { media?: Media; size?: number }) =>
  media ? (
    <img className="thumb" src={media.thumbnail_url ?? media.media_url} alt="" width={size} height={Math.round(size * 1.33)} />
  ) : (
    <span className="thumb" style={{ width: size, height: Math.round(size * 1.33) }} />
  );
/* eslint-enable @next/next/no-img-element */

export const ago = (at: number) => {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

type Day = { day: number; comments: number; dms: number };

/** Smooth two-series area chart (comments vs DMs), rendered on the server as SVG. */
export function AreaChart({ days }: { days: Day[] }) {
  const W = 720, H = 240, L = 34, B = 28, T = 12;
  const max = Math.max(4, ...days.flatMap((d) => [d.comments, d.dms]));
  const x = (i: number) => L + 10 + (i * (W - L - 50)) / Math.max(1, days.length - 1);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  // Catmull-Rom style curve through the points, so the line reads as a trend rather than a zig-zag.
  const curve = (vals: number[]) =>
    vals.reduce((p, v, i) => {
      if (i === 0) return `M${x(0)},${y(v)}`;
      const cx = (x(i - 1) + x(i)) / 2;
      return `${p} C${cx},${y(vals[i - 1])} ${cx},${y(v)} ${x(i)},${y(v)}`;
    }, "");
  const area = (vals: number[]) => `${curve(vals)} L${x(vals.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const ticks = [0, Math.round(max / 2), max];
  const comments = days.map((d) => d.comments);
  const dms = days.map((d) => d.dms);
  const label = (d: Day) => new Date(d.day).toLocaleDateString(undefined, { day: "2-digit", month: "short" });

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={days.map((d) => `${label(d)}: ${d.comments} comments, ${d.dms} DMs`).join("; ")}>
      <defs>
        <linearGradient id="gA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gB" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent-2)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="grid">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} strokeDasharray="3 5" />
            <text x={0} y={y(t) + 4}>{t}</text>
          </g>
        ))}
      </g>
      <path d={area(comments)} fill="url(#gB)" />
      <path d={area(dms)} fill="url(#gA)" />
      <path d={curve(comments)} fill="none" stroke="var(--accent-2)" strokeWidth="2.5" />
      <path d={curve(dms)} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      {days.map((d, i) => (
        <g key={d.day} className="hit">
          <title>{`${label(d)}: ${d.comments} comments · ${d.dms} DMs sent`}</title>
          <rect x={x(i) - 20} y={T} width={40} height={H - T - B} fill="transparent" />
          <line className="guide" x1={x(i)} x2={x(i)} y1={T} y2={H - B} stroke="transparent" strokeDasharray="3 4" />
          <circle className="point" cx={x(i)} cy={y(d.dms)} r={5} fill="var(--bg)" stroke="var(--accent)" strokeWidth="2.5" />
          <circle className="point" cx={x(i)} cy={y(d.comments)} r={5} fill="var(--bg)" stroke="var(--accent-2)" strokeWidth="2.5" />
          <text x={x(i)} y={H - 6} textAnchor="middle">{label(d)}</text>
        </g>
      ))}
    </svg>
  );
}
