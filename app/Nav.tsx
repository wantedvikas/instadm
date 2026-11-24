"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/automations", label: "Automations", icon: "bolt" },
  { href: "/automations/new", label: "New automation", icon: "plus" },
];

export function Nav() {
  const path = usePathname();
  // Most specific link wins, so /automations/new highlights "New automation", not "Automations".
  const current = LINKS.filter((l) => (l.href === "/" ? path === "/" : path.startsWith(l.href))).at(-1)?.href;
  return (
    <nav aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={current === l.href ? "nav active" : "nav"} aria-current={current === l.href ? "page" : undefined}>
          <Icon name={l.icon} />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
