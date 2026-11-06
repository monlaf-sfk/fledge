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

// Profile icon in the top-right corner: opens the Personal Account page (A9-01).
export function AccountLink({ fullName, role }: { fullName: string; role: string }) {
  const path = usePathname();
  const active = path.startsWith("/account");
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <Link
      href="/account"
      aria-label="Personal account"
      title="Personal account"
      className={`group flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition ${
        active ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"
      }`}
    >
      <span
        className={`grid size-9 place-items-center rounded-full font-mono text-sm font-medium ${
          role === "investor" ? "bg-moss text-paper" : "bg-signal text-white"
        }`}
      >
        {initials || "?"}
      </span>
      <span className="text-sm font-medium">Account</span>
    </Link>
  );
}
