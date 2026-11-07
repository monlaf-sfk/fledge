"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Heart,
  Lightbulb,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { InvestorCardView, StartupCardView } from "@/components/cards";
import type { FeedItem } from "@/lib/feed";
import { swipe, trackCardView, type SwipeAction } from "./actions";

const BUTTONS: { action: SwipeAction; label: string; Icon: LucideIcon; Key: LucideIcon; cls: string }[] = [
  { action: "pass", label: "Pass", Icon: X, Key: ArrowLeft, cls: "bg-white text-ink hover:bg-paper-deep" },
  { action: "save", label: "Save", Icon: Star, Key: ArrowDown, cls: "bg-white text-ink hover:bg-paper-deep" },
  { action: "interested", label: "Interested", Icon: Heart, Key: ArrowRight, cls: "bg-signal text-white hover:bg-ink" },
];

const EXIT: Record<SwipeAction, string> = {
  pass: "-translate-x-[120%] -rotate-12 opacity-0",
  save: "translate-y-[40%] scale-90 opacity-0",
  interested: "translate-x-[120%] rotate-12 opacity-0",
};

// Drag past this many pixels to commit a swipe with the mouse or a finger.
const SWIPE_AT = 110;
const HINT_KEY = "fledge_hint_deck";

type Toast = { text: string; href?: string; cta?: string };

const TOAST: Record<SwipeAction, Toast> = {
  pass: { text: "Skipped. This card will not show again." },
  save: { text: "Saved for later.", href: "/saved", cta: "Open Saved" },
  interested: { text: "Interest sent. If they are interested too, you match." },
};

export function Deck({ items, other }: { items: FeedItem[]; other: string }) {
  // Track handled ids, not an index: a server refresh can hand us a shorter list.
  const [handled, setHandled] = useState<Set<string>>(() => new Set());
  const [total] = useState(items.length);
  const [leaving, setLeaving] = useState<SwipeAction | null>(null);
  const [match, setMatch] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hint, setHint] = useState(false);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const [, startTransition] = useTransition();

  // First-visit hint; hidden for good after "Got it" or the first swipe.
  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY)) setHint(true);
    } catch {}
  }, []);
  const dismissHint = useCallback(() => {
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

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
      dismissHint();
      const item = current;
      startTransition(async () => {
        const res = await swipe(item.card.id, action, item.fit.score);
        if (res.error) setError(res.error);
        else if (!res.matchId) setToast(TOAST[action]);
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
    [current, leaving, dismissHint],
  );

  // Mouse / touch drag: right = Interested, left = Pass. Save stays a button.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (leaving || match || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    setDrag({ dx: e.clientX - s.x, dy: (e.clientY - s.y) * 0.25 });
  };
  const onPointerEnd = () => {
    const dx = drag?.dx ?? 0;
    start.current = null;
    setDrag(null);
    if (dx > SWIPE_AT) act("interested");
    else if (dx < -SWIPE_AT) act("pass");
  };

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
        <p className="font-display text-3xl">No more {other} available.</p>
        <p className="mt-3 text-ink-soft">Try again later — new profiles appear here as they join. Meanwhile, revisit the ones you saved.</p>
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
      {hint && (
        <div role="note" className="mb-5 flex items-start gap-4 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden />
          <div className="flex-1 space-y-1">
            <p><b>Drag the card right</b> to show interest, <b>left</b> to skip it.</p>
            <p className="flex flex-wrap items-center gap-1">
              <b>Save</b> keeps it for later in Saved. Buttons and
              <ArrowLeft className="size-3" aria-hidden />
              <ArrowDown className="size-3" aria-hidden />
              <ArrowRight className="size-3" aria-hidden />
              keys work too.
            </p>
          </div>
          <button onClick={dismissHint} className="shrink-0 rounded-full bg-ink px-4 py-1.5 font-medium text-paper hover:bg-signal">
            Got it
          </button>
        </div>
      )}
      <div className="relative">
        {next && (
          <div aria-hidden className="pointer-events-none absolute inset-x-4 top-3 -z-0 scale-[0.97] opacity-40 blur-[1px]">
            {next.kind === "investor" ? <InvestorCardView i={next.card} /> : <StartupCardView s={next.card} />}
          </div>
        )}
        <div key={current.card.id} className="rise">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            style={
              drag
                ? { transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${drag.dx / 18}deg)`, transition: "none" }
                : undefined
            }
            className={`relative cursor-grab touch-pan-y select-none transition duration-300 ease-out active:cursor-grabbing ${
              leaving ? EXIT[leaving] : ""
            }`}
          >
            {current.kind === "investor" ? (
              <InvestorCardView i={current.card} fit={current.fit} />
            ) : (
              <StartupCardView s={current.card} fit={current.fit} />
            )}
            {drag && (
              <>
                <span
                  aria-hidden
                  style={{ opacity: Math.min(1, Math.max(0, drag.dx / SWIPE_AT)) }}
                  className="pointer-events-none absolute left-6 top-6 -rotate-12 rounded-xl border-4 border-signal bg-paper/90 px-4 py-1 font-display text-3xl font-semibold italic text-signal"
                >
                  Interested
                </span>
                <span
                  aria-hidden
                  style={{ opacity: Math.min(1, Math.max(0, -drag.dx / SWIPE_AT)) }}
                  className="pointer-events-none absolute right-6 top-6 rotate-12 rounded-xl border-4 border-ink bg-paper/90 px-4 py-1 font-display text-3xl font-semibold italic text-ink"
                >
                  Pass
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {BUTTONS.map(({ action, label, Icon, Key, cls }) => (
          <button
            key={action}
            onClick={() => act(action)}
            disabled={Boolean(leaving)}
            className={`flex flex-col items-center gap-1 rounded-2xl border border-ink/10 px-3 py-4 font-medium shadow-sm transition disabled:opacity-60 ${cls}`}
          >
            <Icon className="size-6" aria-hidden />
            {label}
            <span className="hidden font-mono text-[10px] opacity-50 sm:block"><Key className="size-3" aria-hidden /></span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-center font-mono text-xs text-ink-soft">
        {position + 1} / {total} · ranked by fit · drag the card or use the buttons
      </p>
      {error && <p role="alert" className="mt-3 text-center text-sm text-[#a8320a]">{error}</p>}

      {toast && (
        <div
          role="status"
          className="rise fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-4 rounded-full bg-ink px-5 py-3 text-sm text-paper shadow-xl"
        >
          {toast.text}
          {toast.href && (
            <Link href={toast.href} className="font-medium text-signal underline-offset-4 hover:underline">
              {toast.cta}
            </Link>
          )}
        </div>
      )}

      {match && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-5 backdrop-blur-sm">
          <div className="rise w-full max-w-md rounded-[28px] bg-paper p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">You have a new match!</p>
            <p className="mt-4 inline-block -rotate-6 rounded-xl border-4 border-signal px-5 py-2 font-display text-4xl font-semibold italic text-signal">
              It&apos;s a match
            </p>
            <p className="mt-6 text-lg">
              You and <strong>{match.name}</strong> are both interested.
            </p>
            <p className="mt-2 text-sm text-ink-soft">Full profile and chat are now unlocked.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href={`/matches/${match.id}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-signal">
                Open chat
                <ArrowRight className="size-4" aria-hidden />
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
