"use client";

import { useEffect, useRef } from "react";

// Hero background: founders (orange) and investors (green) drift, link to neighbours,
// and every few seconds a founder–investor pair "matches" with a bright link and a ring.
// Pauses off-screen, caps pixel ratio, static frame under prefers-reduced-motion.
export function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ORANGE = "232, 84, 28";
    const GREEN = "31, 138, 98";
    const LINK = 130;

    type Node = { x: number; y: number; vx: number; vy: number; r: number; side: 0 | 1 };
    type Pulse = { a: Node; b: Node; t: number };
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    const pulses: Pulse[] = [];
    const pointer = { x: -9999, y: -9999 };
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let nextMatch = 1200;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / (coarse ? 26000 : 16000)));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1.2 + Math.random() * 1.8,
        side: (i % 2) as 0 | 1,
      }));
    };

    const spawnMatch = () => {
      const founders = nodes.filter((n) => n.side === 0);
      for (let tries = 0; tries < 20; tries++) {
        const a = founders[Math.floor(Math.random() * founders.length)];
        const b = nodes
          .filter((n) => n.side === 1)
          .map((n) => ({ n, d: Math.hypot(n.x - a.x, n.y - a.y) }))
          .filter((x) => x.d < LINK * 1.6)
          .sort((p, q) => p.d - q.d)[0]?.n;
        if (b) {
          pulses.push({ a, b, t: 0 });
          return;
        }
      }
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        // gentle pull toward the pointer
        const dx = pointer.x - n.x;
        const dy = pointer.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 180 && d > 1) {
          n.vx += (dx / d) * 0.012;
          n.vy += (dy / d) * 0.012;
        }
        n.vx *= 0.985;
        n.vy *= 0.985;
        n.vx += (Math.random() - 0.5) * 0.01;
        n.vy += (Math.random() - 0.5) * 0.01;
        n.x += n.vx * dt * 0.06;
        n.y += n.vy * dt * 0.06;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK) continue;
          const alpha = (1 - d / LINK) * 0.22;
          ctx.strokeStyle = `rgba(244, 239, 228, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = `rgba(${n.side === 0 ? ORANGE : GREEN}, 0.9)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.t += dt / 1600;
        if (p.t >= 1) {
          pulses.splice(k, 1);
          continue;
        }
        const fade = Math.sin(Math.PI * p.t);
        const grad = ctx.createLinearGradient(p.a.x, p.a.y, p.b.x, p.b.y);
        grad.addColorStop(0, `rgba(${ORANGE}, ${fade})`);
        grad.addColorStop(1, `rgba(${GREEN}, ${fade})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.a.x, p.a.y);
        ctx.lineTo(p.b.x, p.b.y);
        ctx.stroke();
        const mx = (p.a.x + p.b.x) / 2;
        const my = (p.a.y + p.b.y) / 2;
        ctx.strokeStyle = `rgba(232, 84, 28, ${(1 - p.t) * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mx, my, 6 + p.t * 46, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loop = (t: number) => {
      const dt = Math.min(48, t - last);
      last = t;
      nextMatch -= dt;
      if (nextMatch <= 0) {
        spawnMatch();
        nextMatch = 1400 + Math.random() * 1600;
      }
      draw(dt);
      if (visible) raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduce) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    window.addEventListener("resize", resize);
    if (!coarse) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 -z-10 h-full w-full" />;
}
