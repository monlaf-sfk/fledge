import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Insights · Fledge" };

const STEP_LABEL: Record<string, string> = {
  signed_up: "Signed up",
  profile_completed: "Completed profile",
  viewed_feed: "Viewed a card",
  showed_interest: "Pressed Interested",
  got_real_match: "Got a real match",
  sent_message: "Sent a message",
};

export default async function InsightsPage() {
  const { supabase, userId } = await requireOnboarded();
  const [{ data: funnel, error }, { data: mine }] = await Promise.all([
    supabase.rpc("funnel_summary"),
    supabase.from("swipes").select("action").eq("actor_id", userId),
  ]);

  const steps = ((funnel ?? []) as { step: string; users: number }[]).map((s) => ({
    ...s,
    users: Number(s.users),
  }));
  const top = Math.max(1, steps[0]?.users ?? 1);
  const counts = { pass: 0, save: 0, interested: 0 };
  for (const s of mine ?? []) counts[s.action as keyof typeof counts]++;
  const total = counts.pass + counts.save + counts.interested;

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Insights · live product data</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.95] tracking-tight">
        Where the funnel leaks.
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Unique users at each step of discover → evaluate → match → connect, from this prototype&apos;s database.
        Matches with demo profiles are excluded, so &quot;real match&quot; counts only mutual interest between two people.
      </p>

      {error ? (
        <p className="mt-10 rounded-xl border border-signal/40 bg-signal/10 px-4 py-3 text-sm">Could not load the funnel.</p>
      ) : (
        <ol className="mt-10 space-y-3">
          {steps.map((s, i) => {
            const prev = i === 0 ? s.users : steps[i - 1].users;
            const conv = prev > 0 ? Math.round((s.users / prev) * 100) : 0;
            return (
              <li key={s.step} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-4">
                <span className="text-sm font-medium">{STEP_LABEL[s.step] ?? s.step}</span>
                <span className="relative h-10 overflow-hidden rounded-xl bg-paper-deep">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-xl ${i % 2 ? "bg-moss" : "bg-ink"}`}
                    style={{ width: `${Math.max(2, (s.users / top) * 100)}%` }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center font-mono text-sm text-paper mix-blend-difference">
                    {s.users}
                  </span>
                </span>
                <span className="w-16 text-right font-mono text-xs text-ink-soft">{i === 0 ? "—" : `${conv}%`}</span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="mt-16">
        <h2 className="font-display text-3xl">Your actions</h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-4">
          {[
            ["Cards acted on", total],
            ["Pass", counts.pass],
            ["Save", counts.save],
            ["Interested", counts.interested],
          ].map(([k, v]) => (
            <div key={k} className="bg-paper p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{k}</p>
              <p className="mt-3 font-display text-5xl">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Events tracked: signup_completed, profile_completed, card_viewed, card_action, match_created, message_sent.
        </p>
      </section>
    </main>
  );
}
