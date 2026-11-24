// Small stroke icons (24x24, Lucide-style) so the UI needs no icon dependency.
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  plus: "M12 5v14M5 12h14",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  refresh: "M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5",
  logout: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  pause: "M8 5v14M16 5v14",
  play: "M7 4l13 8-13 8z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  external: "M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
};

export type IconName = keyof typeof PATHS;

export const Icon = ({ name, size = 18 }: { name: IconName; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[name]} />
  </svg>
);
