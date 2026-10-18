"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { TrackedLink } from "@/components/public-track";

// After the hero scrolls away: a slim top bar (desktop) and a bottom action bar (mobile),
// so the sign-up button is always one tap away.
export function StickyCta() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-50 hidden border-b border-line bg-paper/85 backdrop-blur transition duration-300 md:block ${
          shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-ink-soft lg:inline">Free during beta · 1-minute setup</span>
            <TrackedLink cta="sticky_founder" href="/signup?role=founder" className="rounded-full bg-signal px-4 py-2 font-medium text-white transition hover:bg-ink">
              I&apos;m raising
            </TrackedLink>
            <TrackedLink cta="sticky_investor" href="/signup?role=investor" className="rounded-full border-2 border-ink px-4 py-1.5 font-medium transition hover:border-signal hover:text-signal">
              I&apos;m investing
            </TrackedLink>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 p-3 backdrop-blur transition duration-300 md:hidden ${
          shown ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-2 gap-2">
          <TrackedLink cta="sticky_m_founder" href="/signup?role=founder" className="rounded-xl bg-signal py-3 text-center font-medium text-white">
            I&apos;m raising
          </TrackedLink>
          <TrackedLink cta="sticky_m_investor" href="/signup?role=investor" className="rounded-xl border-2 border-ink py-2.5 text-center font-medium">
            I&apos;m investing
          </TrackedLink>
        </div>
      </div>
    </>
  );
}
