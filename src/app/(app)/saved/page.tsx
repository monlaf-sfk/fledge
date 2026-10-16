import type { Metadata } from "next";
import Link from "next/link";
import { InvestorCardView, StartupCardView } from "@/components/cards";
import {
  INVESTOR_COLUMNS,
  STARTUP_COLUMNS,
  type InvestorCard,
  type StartupCard,
} from "@/lib/catalog";
import { fitScore } from "@/lib/scoring";
import { requireOnboarded } from "@/lib/session";
import { SavedActions } from "./saved-actions";

export const metadata: Metadata = { title: "Saved · Fledge" };

export default async function SavedPage() {
  const { supabase, userId, role, ownCardId } = await requireOnboarded();
  const founder = role === "founder";

  const [{ data: rows }, { data: own }] = await Promise.all([
    supabase
      .from("swipes")
      .select(founder ? `investor:investor_profiles(${INVESTOR_COLUMNS})` : `startup:startups(${STARTUP_COLUMNS})`)
      .eq("actor_id", userId)
      .eq("action", "save")
      .order("updated_at", { ascending: false }),
    founder
      ? supabase.from("startups").select(STARTUP_COLUMNS).eq("id", ownCardId!).single()
      : supabase.from("investor_profiles").select(INVESTOR_COLUMNS).eq("id", ownCardId!).single(),
  ]);

  const items = ((rows ?? []) as unknown as { investor?: InvestorCard; startup?: StartupCard }[])
    .map((r) => (founder ? r.investor : r.startup))
    .filter((c): c is InvestorCard & StartupCard => Boolean(c));

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Saved · {items.length}</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.95] tracking-tight">
        Worth a second look.
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-[26px] border-2 border-dashed border-ink/20 p-10 text-center">
          <p className="text-ink-soft">Nothing saved yet. Press Save in Discover to keep a profile for later.</p>
          <Link href="/discover" className="mt-6 inline-block rounded-full bg-ink px-5 py-3 font-medium text-paper hover:bg-signal">
            Go to Discover
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {items.map((card) => {
            const fit = founder
              ? fitScore(own as StartupCard, card as InvestorCard)
              : fitScore(card as StartupCard, own as InvestorCard);
            return (
              <div key={card.id} className="space-y-3">
                {founder ? (
                  <InvestorCardView i={card as InvestorCard} fit={fit} />
                ) : (
                  <StartupCardView s={card as StartupCard} fit={fit} />
                )}
                <SavedActions targetId={card.id} score={fit.score} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
