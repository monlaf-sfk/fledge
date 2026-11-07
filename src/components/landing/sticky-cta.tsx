"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AccountButton } from "@/components/landing/account-button";
import { Logo } from "@/components/logo";
import { TrackedLink } from "@/components/public-track";

// Section navigation for the landing page. After the hero scrolls away a sticky header
// appears with links to every section; the section in view is highlighted (scroll-spy).
// Mobile: the same links as a horizontal scroll strip, plus a bottom bar with sign-up buttons.
const SECTIONS = [
  { id: "problem", label: "Problem" },
  { id: "how", label: "How it works" },
  { id: "try", label: "Try it" },
  { id: "why", label: "Fit score" },
  { id: "compare", label: "Compare" },
  { id: "market", label: "Market" },
  { id: "faq", label: "FAQ" },
];

export function StickyCta({ signedIn = false }: { signedIn?: boolean }) {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setShown(window.scrollY > window.innerHeight * 0.85);
      // Active section = the last one whose top has passed the upper third of the screen.
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep the active chip visible in the mobile strip.
  useEffect(() => {
    if (!active || !strip.current) return;
    strip.current.querySelector<HTMLElement>(`[data-id="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const link = (s: (typeof SECTIONS)[number], mobile = false) => (
    <a
      key={s.id}
      data-id={s.id}
      href={`#${s.id}`}
      aria-current={active === s.id ? "true" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
        active === s.id ? "bg-ink text-paper" : mobile ? "text-ink-soft" : "text-ink-soft hover:text-ink"
      }`}
    >
      {s.label}
    </a>
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/90 backdrop-blur transition duration-300 ${
          shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
          <Logo className="shrink-0" />
          <nav aria-label="Sections" className="hidden items-center gap-0.5 lg:flex">
            {SECTIONS.map((s) => link(s))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            {signedIn ? (
              <AccountButton className="grid size-9 place-items-center rounded-full border border-ink/20 text-ink transition hover:border-signal hover:text-signal" />
            ) : (
              <>
                <Link href="/login" className="rounded-full px-3 py-2 font-medium text-ink-soft transition hover:text-ink">
                  Log in
                </Link>
                <TrackedLink cta="sticky_founder" href="/signup?role=founder" className="hidden rounded-full md:inline-block bg-signal px-4 py-2 font-medium text-white transition hover:bg-ink">
                  I&apos;m raising
                </TrackedLink>
                <TrackedLink cta="sticky_investor" href="/signup?role=investor" className="hidden rounded-full md:inline-block border-2 border-ink px-4 py-1.5 font-medium transition hover:border-signal hover:text-signal">
                  I&apos;m investing
                </TrackedLink>
              </>
            )}
          </div>
        </div>
        {/* tablet + mobile: scrollable section strip */}
        <div ref={strip} className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 [scrollbar-width:none] lg:hidden">
          {SECTIONS.map((s) => link(s, true))}
        </div>
      </header>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 p-3 backdrop-blur transition duration-300 md:hidden ${
          shown ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-2 gap-2">
          {signedIn ? (
            <Link href="/discover" className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-signal py-3 text-center font-medium text-white">
              Go to Discover
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <>
              <TrackedLink cta="sticky_m_founder" href="/signup?role=founder" className="rounded-xl bg-signal py-3 text-center font-medium text-white">
                I&apos;m raising
              </TrackedLink>
              <TrackedLink cta="sticky_m_investor" href="/signup?role=investor" className="rounded-xl border-2 border-ink py-2.5 text-center font-medium">
                I&apos;m investing
              </TrackedLink>
            </>
          )}
        </div>
      </div>
    </>
  );
}
