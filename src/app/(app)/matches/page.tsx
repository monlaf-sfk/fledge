import type { Metadata } from "next";
import Link from "next/link";
import { DemoBadge } from "@/components/cards";
import { INVESTOR_TYPE_LABEL, STAGE_LABEL } from "@/lib/catalog";
import { loadMatches } from "@/lib/matches";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Matches · Fledge" };

export default async function MatchesPage() {
  const session = await requireOnboarded();
  const matches = await loadMatches(session);
  const founder = session.role === "founder";

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Matches · {matches.length}</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.95] tracking-tight">
        Mutual interest. <em className="italic text-signal">Now talk.</em>
      </h1>

      {matches.length === 0 ? (
        <div className="mt-10 rounded-[26px] border-2 border-dashed border-ink/20 p-10 text-center">
          <p className="text-ink-soft">No matches yet. Press Interested on profiles that fit — a match appears when they do the same.</p>
          <Link href="/discover" className="mt-6 inline-block rounded-full bg-ink px-5 py-3 font-medium text-paper hover:bg-signal">
            Go to Discover
          </Link>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white/60">
          {matches.map((m) => {
            const title = founder ? m.investor.display_name : m.startup.name;
            const sub = founder
              ? `${INVESTOR_TYPE_LABEL[m.investor.investor_type]} · ${m.investor.industries.slice(0, 3).join(", ")}`
              : `${STAGE_LABEL[m.startup.stage]} · ${m.startup.industry} · ${m.startup.private?.founder_name ?? ""}`;
            const demo = founder ? m.investor.is_demo : m.startup.is_demo;
            return (
              <li key={m.id}>
                <Link href={`/matches/${m.id}`} className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-white">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-display text-2xl">
                      <span className="truncate">{title}</span>
                      {demo && <DemoBadge />}
                    </p>
                    <p className="mt-1 truncate text-sm text-ink-soft">{sub}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">Chat →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
