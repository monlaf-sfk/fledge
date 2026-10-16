"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/saved", label: "Saved" },
  { href: "/matches", label: "Matches" },
];

export function NavLinks({ mobile = false, isAdmin = false }: { mobile?: boolean; isAdmin?: boolean }) {
  const path = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/insights", label: "Insights" }] : LINKS;

  return (
    <nav
      className={
        mobile
          ? "mx-auto flex max-w-6xl justify-between px-5 py-2 text-sm"
          : "hidden items-center gap-1 text-sm md:flex"
      }
    >
      {links.map((l) => {
        const active = path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-4 py-2 font-medium transition ${
              active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
