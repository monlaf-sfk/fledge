import type { Metadata } from "next";
import { loadFeed } from "@/lib/feed";
import { requireOnboarded } from "@/lib/session";
import { Deck } from "./deck";

export const metadata: Metadata = { title: "Discover · Fledge" };

export default async function DiscoverPage() {
  const session = await requireOnboarded();
  const items = await loadFeed(session);

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-10 lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Discover</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.95] tracking-tight">
          {session.role === "founder" ? "Investors who fit you." : "Startups inside your thesis."}
        </h1>
        <p className="mt-5 max-w-sm text-ink-soft">
          Cards are ranked by a transparent score: industry 35 · stage 30 · geography 20 · ticket 15. A match
          happens only when both sides press Interested.
        </p>
        <ul className="mt-8 space-y-2 text-sm text-ink-soft">
          <li><b className="text-ink">Pass</b> — not relevant, hide it.</li>
          <li><b className="text-ink">Save</b> — maybe later, keep it in Saved.</li>
          <li><b className="text-ink">Interested</b> — want to connect.</li>
        </ul>
        <a
          href="/onboarding"
          className="mt-8 block max-w-sm rounded-2xl border border-dashed border-signal/50 bg-signal/5 p-4 text-sm transition hover:bg-signal/10"
        >
          <b>Add contacts{session.role === "founder" ? ", deck and metrics" : " and LinkedIn"}</b>
          <span className="block text-ink-soft">Shown only after a match — makes the first call easier. Optional →</span>
        </a>
      </aside>
      <section>
        <Deck items={items} />
      </section>
    </main>
  );
}
