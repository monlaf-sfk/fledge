"use client";

import { useEffect } from "react";

// Tiny scroll/pointer engine for the landing page. No libraries.
//  [data-reveal]  → gets .is-in once it enters the viewport (CSS does the animation)
//  [data-scrub]   → gets --p in 0..1 while it scrolls through the viewport
//  [data-count]   → counts up to its value when revealed
//  [data-tilt]    → follows the pointer with a small 3D tilt (desktop only)
//  [data-magnetic]→ is pulled toward the pointer when it comes close (desktop only)
//  [data-spotlight] gets --sx/--sy: pointer position inside it, for a moving light
//  [data-scramble]→ text decodes from random glyphs when revealed
// Only transform/opacity are animated; everything is static under prefers-reduced-motion.
export function LandingMotion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const root = document.documentElement;
    root.classList.add("motion-ready");

    const reveal = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
    const scrambles = Array.from(document.querySelectorAll<HTMLElement>("[data-scramble]"));
    const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";

    const scramble = (el: HTMLElement) => {
      // Original text is kept in data-final; the data-scramble attribute itself is only a marker.
      const final = el.dataset.final ?? el.textContent ?? "";
      el.dataset.final = final;
      if (reduce) return;
      const start = performance.now();
      const dur = 900;
      const step = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        const fixed = Math.floor(final.length * k);
        el.textContent = final
          .split("")
          .map((ch, i) => (i < fixed || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("");
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const countUp = (el: HTMLElement) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix ?? "";
      if (reduce) {
        el.textContent = `${target}${suffix}`;
        return;
      }
      const start = performance.now();
      const dur = 1400;
      const step = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add("is-in");
          if (el.dataset.count) countUp(el);
          if (el.hasAttribute("data-scramble")) scramble(el);
          io.unobserve(el);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    reveal.forEach((el) => io.observe(el));
    counters.forEach((el) => io.observe(el));
    scrambles.forEach((el) => io.observe(el));

    if (reduce) {
      reveal.forEach((el) => el.classList.add("is-in"));
      document.querySelectorAll<HTMLElement>("[data-scrub]").forEach((el) => el.style.setProperty("--p", "1"));
      return () => io.disconnect();
    }

    // Scroll progress for [data-scrub], one rAF per frame.
    const scrubs = Array.from(document.querySelectorAll<HTMLElement>("[data-scrub]"));
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      for (const el of scrubs) {
        const r = el.getBoundingClientRect();
        // 0 when the element's top hits the bottom of the viewport, 1 when its bottom hits the top.
        // Sticky sections use data-scrub="pin": 0..1 across the pinned distance instead.
        const p =
          el.dataset.scrub === "pin"
            ? -r.top / Math.max(1, r.height - vh)
            : (vh - r.top) / (vh + r.height);
        const clamped = Math.min(1, Math.max(0, p));
        el.style.setProperty("--p", clamped.toFixed(4));
        // Step index for pinned storytelling sections: data-steps="4" → data-step 0..3
        const steps = Number(el.dataset.steps);
        if (steps) el.dataset.step = String(Math.min(steps - 1, Math.floor(clamped * steps)));
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Pointer tilt for the hero stack.
    const tilts = coarse ? [] : Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    const magnets = coarse ? [] : Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
    const spots = coarse ? [] : Array.from(document.querySelectorAll<HTMLElement>("[data-spotlight]"));
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      for (const el of tilts) {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      }
      for (const el of magnets) {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
        el.style.translate = near ? `${(dx * 0.25).toFixed(1)}px ${(dy * 0.35).toFixed(1)}px` : "0 0";
      }
      for (const el of spots) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${(e.clientX - r.left).toFixed(0)}px`);
        el.style.setProperty("--sy", `${(e.clientY - r.top).toFixed(0)}px`);
      }
    };
    if (tilts.length || magnets.length || spots.length) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
