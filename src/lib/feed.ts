import {
  INVESTOR_COLUMNS,
  STARTUP_COLUMNS,
  type InvestorCard,
  type StartupCard,
} from "./catalog";
import { fitScore, type Fit } from "./scoring";
import type { Session } from "./session";

export type FeedItem =
  | { kind: "investor"; card: InvestorCard; fit: Fit }
  | { kind: "startup"; card: StartupCard; fit: Fit };

// Ranked Discover feed: the other side's cards the user has not acted on yet,
// highest fit first; real profiles before demo ones on equal score.
export async function loadFeed({ supabase, userId, role, ownCardId }: Session): Promise<FeedItem[]> {
  const { data: swipes } = await supabase
    .from("swipes")
    .select("startup_id, investor_id")
    .eq("actor_id", userId);
  const seen = new Set((swipes ?? []).map((s) => s.startup_id ?? s.investor_id));

  let items: FeedItem[];
  if (role === "founder") {
    const [{ data: own }, { data: investors }] = await Promise.all([
      supabase.from("startups").select(STARTUP_COLUMNS).eq("id", ownCardId!).single(),
      supabase.from("investor_profiles").select(INVESTOR_COLUMNS),
    ]);
    const me = own as StartupCard;
    items = ((investors ?? []) as InvestorCard[])
      .filter((i) => !seen.has(i.id))
      .map((card) => ({ kind: "investor" as const, card, fit: fitScore(me, card) }));
  } else {
    const [{ data: own }, { data: startups }] = await Promise.all([
      supabase.from("investor_profiles").select(INVESTOR_COLUMNS).eq("id", ownCardId!).single(),
      supabase.from("startups").select(STARTUP_COLUMNS),
    ]);
    const me = own as InvestorCard;
    items = ((startups ?? []) as StartupCard[])
      .filter((s) => !seen.has(s.id))
      .map((card) => ({ kind: "startup" as const, card, fit: fitScore(card, me) }));
  }

  return items.sort(
    (a, b) => b.fit.score - a.fit.score || Number(a.card.is_demo) - Number(b.card.is_demo),
  );
}
