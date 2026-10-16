"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { InvestorCardView, StartupCardView } from "@/components/cards";
import type { FeedItem } from "@/lib/feed";
import { swipe, trackCardView, type SwipeAction } from "./actions";

const BUTTONS: { action: SwipeAction; label: string; icon: string; key: string; cls: string }[] = [
  { action: "pass", label: "Pass", icon: "✕", key: "←", cls: "bg-white text-ink hover:bg-paper-deep" },
  { action: "save", label: "Save", icon: "☆", key: "↓", cls: "bg-white text-ink hover:bg-paper-deep" },
  { action: "interested", label: "Interested", icon: "♥", key: "→", cls: "bg-signal text-white hover:bg-ink" },
];

const EXIT: Record<SwipeAction, string> = {
  pass: "-translate-x-[120%] -rotate-12 opacity-0",
  save: "translate-y-[40%] scale-90 opacity-0",
  interested: "translate-x-[120%] rotate-12 opacity-0",
};

export function Deck({ items }: { items: FeedItem[] }) {
  // Track handled ids, not an index: a server refresh can hand us a shorter list.
  const [handled, setHandled] = useState<Set<string>>(() => new Set());
  const [total] = useState(items.length);
  const [leaving, setLeaving] = useState<SwipeAction | null>(null);
  const [match, setMatch] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const queue = items.filter((i) => !handled.has(i.card.id));
  const current = queue[0];
  const currentId = current?.card.id;
  const position = handled.size;

  useEffect(() => {
    if (current) void trackCardView(current.card.id, current.fit.score, position);
    // Track once per card, not on every re-render with a new object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const act = useCallback(
    (action: SwipeAction) => {
      if (!current || leaving) return;
      setError(null);
      setLeaving(action);
      const item = current;
      startTransition(async () => {
        const res = await swipe(item.card.id, action, item.fit.score);
        if (res.error) setError(res.error);
        if (res.matchId) {
          setMatch({
            id: res.matchId,
            name: item.kind === "investor" ? item.card.display_name : item.card.name,
          });
        }
      });
      setTimeout(() => {
        setHandled((h) => new Set(h).add(item.card.id));
        setLeaving(null);
      }, 280);
    },
    [current, leaving],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || e.repeat || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") act("pass");
      if (e.key === "ArrowDown") act("save");
      if (e.key === "ArrowRight") act("interested");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, match]);

  if (!current) {
    return (
      <div className="rounded-[26px] border-2 border-dashed border-ink/20 p-10 text-center">
        <p className="font-display text-3xl">You&apos;ve seen everyone for now.</p>
        <p className="mt-3 text-ink-soft">New profiles appear here as they join. Revisit the ones you saved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/saved" className="rounded-full bg-ink px-5 py-3 font-medium text-paper hover:bg-signal">
            Open Saved
          </Link>
          <Link href="/matches" className="rounded-full border-2 border-ink px-5 py-3 font-medium hover:border-signal hover:text-signal">
            Matches
          </Link>
        </div>
      </div>
    );
  }

  const next = queue[1];

  return (
    <div>
      <div className="relative">
        {next && (
          <div aria-hidden className="pointer-events-none absolute inset-x-4 top-3 -z-0 scale-[0.97] opacity-40 blur-[1px]">
            {next.kind === "investor" ? <InvestorCardView i={next.card} /> : <StartupCardView s={next.card} />}
          </div>
        )}
        <div
          key={current.card.id}
          className={`relative transition duration-300 ease-out ${leaving ? EXIT[leaving] : "rise"}`}
        >
          {current.kind === "investor" ? (
            <InvestorCardView i={current.card} fit={current.fit} />
          ) : (
            <StartupCardView s={current.card} fit={current.fit} />
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {BUTTONS.map((b) => (
          <button
            key={b.action}
            onClick={() => act(b.action)}
            disabled={Boolean(leaving)}
            className={`flex flex-col items-center gap-1 rounded-2xl border border-ink/10 px-3 py-4 font-medium shadow-sm transition disabled:opacity-60 ${b.cls}`}
          >
            <span className="text-xl" aria-hidden>
              {b.icon}
            </span>
            {b.label}
            <span className="hidden font-mono text-[10px] opacity-50 sm:block">{b.key}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-center font-mono text-xs text-ink-soft">
        {position + 1} / {total} · ranked by fit
      </p>
      {error && <p role="alert" className="mt-3 text-center text-sm text-[#a8320a]">{error}</p>}

      {match && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-5 backdrop-blur-sm">
          <div className="rise w-full max-w-md rounded-[28px] bg-paper p-8 text-center">
            <p className="inline-block -rotate-6 rounded-xl border-4 border-signal px-5 py-2 font-display text-4xl font-semibold italic text-signal">
              It&apos;s a match
            </p>
            <p className="mt-6 text-lg">
              You and <strong>{match.name}</strong> are both interested.
            </p>
            <p className="mt-2 text-sm text-ink-soft">Full profile and chat are now unlocked.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href={`/matches/${match.id}`} className="rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-signal">
                Open chat →
              </Link>
              <button onClick={() => setMatch(null)} className="rounded-full border-2 border-ink px-6 py-3 font-medium">
                Keep swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
