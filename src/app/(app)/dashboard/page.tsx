import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOnboarded, requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard · Fledge" };

export default async function DashboardPage() {
  // Team admin accounts without a marketplace profile land on analytics.
  const session = await requireSession();
  if (session.isAdmin && !session.ownCardId) redirect("/insights");

  const { supabase, userId, role, fullName } = await requireOnboarded();

  const [{ data: swipes }, { count: matchCount }] = await Promise.all([
    supabase.from("swipes").select("action").eq("actor_id", userId),
    supabase.from("matches").select("id", { count: "exact", head: true }),
  ]);
  const saved = (swipes ?? []).filter((s) => s.action === "save").length;
  const interested = (swipes ?? []).filter((s) => s.action === "interested").length;
  const firstName = fullName.split(" ")[0];

  const tiles = [
    { label: "Interested sent", value: interested, href: "/discover" },
    { label: "Saved", value: saved, href: "/saved" },
    { label: "Matches", value: matchCount ?? 0, href: "/matches" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
      <h1 className="font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.95] tracking-tight">
        Hi, {firstName}.{" "}
        <span className="italic text-ink-soft">
          {role === "founder" ? "Let's find investors who fit." : "Let's filter your deal flow."}
        </span>
      </h1>

      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="group bg-paper p-7 transition hover:bg-white">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{t.label}</p>
            <p className="mt-6 font-display text-6xl">{t.value}</p>
            <p className="mt-2 text-sm text-ink-soft transition group-hover:text-signal">Open →</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/discover" className="rounded-2xl bg-signal px-6 py-4 text-lg font-medium text-white transition hover:bg-ink">
          Continue discovering →
        </Link>
        <Link href="/onboarding" className="rounded-2xl border-2 border-ink px-6 py-4 text-lg font-medium transition hover:border-signal hover:text-signal">
          Edit {role === "founder" ? "startup" : "investor"} profile
        </Link>
      </div>
    </main>
  );
}
