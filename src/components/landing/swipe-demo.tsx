"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackPublic } from "@/app/track-actions";
import { anonId } from "@/components/public-track";
import { captureClient } from "@/components/analytics-provider";

// Playable demo on the landing page: drag a card right (Interested) or left (Pass).
// Some demo investors "like you back" and fire a match with confetti.
type DemoCard = { name: string; type: string; thesis: string; fit: number; tags: string[]; match: boolean };

const CARDS: DemoCard[] = [
  { name: "Steppe Angels", type: "Angel syndicate", thesis: "First-time founders in Central Asia, hands-on mentoring.", fit: 100, tags: ["Fintech", "Pre-seed–Seed", "$25–100K"], match: true },
  { name: "Silk Road Ventures", type: "VC fund", thesis: "B2B software and fintech scaling across CIS.", fit: 85, tags: ["SaaS", "Seed–A", "$200K–1.5M"], match: false },
  { name: "Nomad Climate Fund", type: "VC fund", thesis: "Climate, energy and agriculture technology.", fit: 35, tags: ["Climate", "Pre-seed", "$100–500K"], match: false },
  { name: "Astana Launch Lab", type: "Accelerator", thesis: "12-week programme for teams with a working prototype.", fit: 65, tags: ["Edtech", "Idea–Pre-seed", "$20–50K"], match: true },
];

const COLORS = ["#e8541c", "#1f8a62", "#f4efe4", "#2a78d6", "#ffb347"];

function burst(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const parts = Array.from({ length: 140 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const speed = 5 + Math.random() * 9;
    return {
      x: width / 2,
      y: height * 0.55,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      s: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  });
  const start = performance.now();
  const frame = (t: number) => {
    const k = (t - start) / 1800;
    ctx.clearRect(0, 0, width, height);
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, width, height);
  };
  requestAnimationFrame(frame);
}

export function SwipeDemo() {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, active: false });
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const [match, setMatch] = useState<string | null>(null);
  const [likes, setLikes] = useState(0);
  const start = useRef(0);
  const confetti = useRef<HTMLCanvasElement>(null);

  const card = CARDS[index];

  const decide = useCallback(
    (dir: "left" | "right") => {
      if (!card || leaving) return;
      setLeaving(dir);
      void trackPublic("cta_clicked", anonId(), { cta: dir === "right" ? "demo_interested" : "demo_pass", card: card.name });
      captureClient("demo_swipe", { action: dir === "right" ? "interested" : "pass", card: card.name });
      setTimeout(() => {
        if (dir === "right") {
          setLikes((l) => l + 1);
          if (card.match) {
            setMatch(card.name);
            if (confetti.current) burst(confetti.current);
          }
        }
        setIndex((i) => i + 1);
        setLeaving(null);
        setDrag({ x: 0, active: false });
      }, 320);
    },
    [card, leaving],
  );

  useEffect(() => {
    if (!match) return;
    const t = setTimeout(() => setMatch(null), 2600);
    return () => clearTimeout(t);
  }, [match]);

  const x = leaving === "right" ? 700 : leaving === "left" ? -700 : drag.x;
  const rot = x / 18;
  const likeOpacity = Math.max(0, Math.min(1, x / 110));
  const passOpacity = Math.max(0, Math.min(1, -x / 110));

  return (
    <div className="relative">
      <canvas ref={confetti} aria-hidden className="pointer-events-none absolute -inset-x-20 -inset-y-10 z-30 h-[calc(100%+80px)] w-[calc(100%+160px)]" />

      <div className="relative mx-auto h-[420px] w-full max-w-[360px] select-none">
        {CARDS.slice(index, index + 3)
          .reverse()
          .map((c, i, arr) => {
            const top = i === arr.length - 1;
            const depth = arr.length - 1 - i;
            return (
              <article
                key={c.name}
                onPointerDown={
                  top
                    ? (e) => {
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId);
                        } catch {
                          // capture can fail for synthetic or cancelled pointers; dragging still works
                        }
                        start.current = e.clientX;
                        setDrag({ x: 0, active: true });
                      }
                    : undefined
                }
                onPointerMove={top ? (e) => drag.active && setDrag({ x: e.clientX - start.current, active: true }) : undefined}
                onPointerUp={
                  top
                    ? () => {
                        if (drag.x > 110) decide("right");
                        else if (drag.x < -110) decide("left");
                        else setDrag({ x: 0, active: false });
                      }
                    : undefined
                }
                className={`absolute inset-0 rounded-[26px] bg-moss p-6 text-paper shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] ${top ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
                style={{
                  transform: top
                    ? `translateX(${x}px) rotate(${rot}deg)`
                    : `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`,
                  transition: drag.active && !leaving ? "none" : "transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)",
                  opacity: top && leaving ? 0 : 1 - depth * 0.25,
                }}
              >
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">
                  <span>{c.type}</span>
                  <span className="rounded-full bg-signal/20 px-2 py-0.5 text-signal">{c.fit}% fit</span>
                </div>
                <h3 className="mt-6 font-display text-4xl leading-none">{c.name}</h3>
                <p className="mt-3 text-paper/75">{c.thesis}</p>
                <ul className="mt-6 flex flex-wrap gap-2 text-xs">
                  {c.tags.map((t) => (
                    <li key={t} className="rounded-full border border-paper/25 px-3 py-1">{t}</li>
                  ))}
                </ul>
                <p className="absolute bottom-6 left-6 right-6 rounded-xl border border-dashed border-paper/25 px-3 py-2 text-xs text-paper/60">
                  🔒 Contacts unlock after a mutual match
                </p>
                {top && (
                  <>
                    <span className="absolute right-6 top-20 -rotate-12 rounded-lg border-4 border-signal px-3 py-1 font-display text-2xl italic text-signal" style={{ opacity: likeOpacity }}>
                      INTERESTED
                    </span>
                    <span className="absolute left-6 top-20 rotate-12 rounded-lg border-4 border-paper/70 px-3 py-1 font-display text-2xl italic text-paper/80" style={{ opacity: passOpacity }}>
                      PASS
                    </span>
                  </>
                )}
              </article>
            );
          })}

        {!card && (
          <div className="absolute inset-0 grid place-items-center rounded-[26px] border-2 border-dashed border-ink/25 p-8 text-center">
            <div>
              <p className="font-display text-3xl">
                {likes > 0 ? "That's the whole flow." : "You passed on everyone."}
              </p>
              <p className="mt-3 text-ink-soft">Real profiles, real matches — sign up and your feed is ranked for you.</p>
              <button onClick={() => { setIndex(0); setLikes(0); }} className="mt-6 rounded-full border-2 border-ink px-5 py-2 text-sm font-medium hover:border-signal hover:text-signal">
                Play again
              </button>
            </div>
          </div>
        )}

        {match && (
          <div role="status" className="absolute inset-0 z-20 grid place-items-center rounded-[26px] bg-ink/80 backdrop-blur-sm">
            <div className="rise text-center">
              <p className="inline-block -rotate-6 rounded-xl border-4 border-signal px-5 py-2 font-display text-4xl italic text-signal">It&apos;s a match</p>
              <p className="mt-4 text-paper">{match} is interested too.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto mt-6 flex max-w-[360px] justify-center gap-4">
        <button
          onClick={() => decide("left")}
          disabled={!card}
          aria-label="Pass"
          className="grid h-16 w-16 place-items-center rounded-full border border-ink/15 bg-white text-2xl shadow-lg transition hover:scale-110 disabled:opacity-40"
        >
          ✕
        </button>
        <button
          onClick={() => decide("right")}
          disabled={!card}
          aria-label="Interested"
          className="grid h-16 w-16 place-items-center rounded-full bg-signal text-2xl text-white shadow-lg shadow-signal/40 transition hover:scale-110 disabled:opacity-40"
        >
          ♥
        </button>
      </div>
      <p className="mt-3 text-center font-mono text-xs text-ink-soft">Drag the card or use the buttons · demo profiles</p>
    </div>
  );
}
