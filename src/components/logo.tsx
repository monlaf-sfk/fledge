import Link from "next/link";

export function Logo({ className = "", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${inverted ? "text-paper" : ""} ${className}`} aria-label="Fledge home">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <path d="M4 22c6-1 10-6 12-14 2 8 6 13 12 14-6 2-9 4-12 6-3-2-6-4-12-6z" fill={inverted ? "var(--paper)" : "var(--moss)"} />
        <circle cx="16" cy="13" r="2.2" fill="var(--signal)" />
      </svg>
      <span className="font-display text-2xl font-semibold tracking-tight">fledge</span>
    </Link>
  );
}
