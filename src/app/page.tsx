import Link from "next/link";
import { Logo } from "@/components/logo";

const steps = [
  { n: "01", title: "Build a structured profile", body: "Founders add stage, industry, traction range and raise. Investors add thesis, stages, geography and cheque size." },
  { n: "02", title: "Swipe a ranked feed", body: "Every card is scored on stage, sector, geography and ticket fit — so the first cards are the relevant ones." },
  { n: "03", title: "Pass, Save or Interested", body: "Three actions, no cold DMs. Nobody gets a message they did not ask for." },
  { n: "04", title: "Match unlocks everything", body: "Mutual interest opens full identity, deck, detailed metrics and a private chat." },
];

const marquee = ["Pre-seed", "Seed", "Fintech", "B2B SaaS", "Edtech", "Almaty", "Astana", "Tashkent", "Bishkek", "Angels", "Accelerators", "Climate", "Marketplaces"];

function StartupCard() {
  return (
    <div className="card-match absolute left-6 top-10 w-[290px] rounded-[22px] border border-ink/15 bg-white p-5 shadow-[0_30px_60px_-25px_rgba(20,38,31,0.45)]">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
        <span>Startup · Seed</span>
        <span className="rounded-full bg-signal/15 px-2 py-0.5 text-signal">92% fit</span>
      </div>
      <h3 className="mt-4 font-display text-3xl leading-none">Tenge Ledger</h3>
      <p className="mt-2 text-sm text-ink-soft">Automated bookkeeping for SMBs in Kazakhstan.</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
        {[["Industry", "Fintech"], ["Geo", "Almaty"], ["Raising", "$300K"], ["Traction", "$5–10K MRR"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-paper px-3 py-2">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{k}</dt>
            <dd className="mt-0.5 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-ink/25 px-3 py-2 text-xs text-ink-soft">
        <LockIcon /> Founder identity &amp; deck unlock after match
      </div>
    </div>
  );
}

function InvestorCard() {
  return (
    <div className="card-pass absolute right-0 top-0 w-[260px] rounded-[22px] bg-moss p-5 text-paper shadow-[0_30px_60px_-25px_rgba(20,38,31,0.6)]">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">Investor · Angel</div>
      <h3 className="mt-4 font-display text-3xl leading-none">Steppe Angels</h3>
      <p className="mt-2 text-sm text-paper/70">Pre-seed to seed, Central Asia, $25–100K tickets.</p>
      <div className="mt-5 flex flex-wrap gap-1.5 text-[11px]">
        {["Fintech", "SaaS", "Logistics"].map((t) => (
          <span key={t} className="rounded-full border border-paper/25 px-2.5 py-1">{t}</span>
        ))}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <nav className="flex items-center gap-2 whitespace-nowrap text-sm">
          <a href="#how" className="hidden px-3 py-2 text-ink-soft hover:text-ink sm:inline">How it works</a>
          <a href="#sides" className="hidden px-3 py-2 text-ink-soft hover:text-ink sm:inline">For whom</a>
          <Link href="/login" className="px-3 py-2 font-medium hover:text-signal">Log in</Link>
          <Link href="/signup" className="rounded-full bg-ink px-4 py-2 font-medium text-paper transition hover:bg-signal">
            Join Fledge
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-16">
        <div>
          <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-ink-soft" style={{ animationDelay: "0ms" }}>
            Founder ↔ investor matching · Central Asia
          </p>
          <h1 className="rise mt-6 font-display text-[clamp(3rem,8vw,6.4rem)] font-medium leading-[0.92] tracking-[-0.03em]" style={{ animationDelay: "120ms" }}>
            Stop cold-pitching.
            <br />
            <em className="font-normal italic text-signal">Start matching.</em>
          </h1>
          <p className="rise mt-7 max-w-md text-lg leading-relaxed text-ink-soft" style={{ animationDelay: "240ms" }}>
            Fledge shows founders the investors who actually fit their stage, sector and raise — and shows
            investors only startups inside their thesis. You connect when interest is mutual.
          </p>
          <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "360ms" }}>
            <Link
              href="/signup?role=founder"
              className="group inline-flex items-center justify-between gap-6 rounded-2xl bg-ink px-6 py-4 text-paper transition hover:bg-moss"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-paper/60">I&apos;m raising</span>
                <span className="text-lg font-medium">Join as founder</span>
              </span>
              <span className="text-2xl transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/signup?role=investor"
              className="group inline-flex items-center justify-between gap-6 rounded-2xl border-2 border-ink px-6 py-4 transition hover:border-signal hover:text-signal"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">I&apos;m investing</span>
                <span className="text-lg font-medium">Join as investor</span>
              </span>
              <span className="text-2xl transition group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        <div className="rise relative mx-auto h-[420px] w-full max-w-[380px]" style={{ animationDelay: "300ms" }} aria-hidden>
          <div className="absolute inset-x-6 bottom-4 top-16 rotate-3 rounded-[28px] bg-paper-deep" />
          <InvestorCard />
          <StartupCard />
          <div className="stamp absolute left-1/2 top-1/2 z-10 rounded-xl border-4 border-signal px-5 py-2 font-display text-4xl font-semibold italic text-signal">
            It&apos;s a match
          </div>
          <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-3">
            {[["✕", "Pass"], ["☆", "Save"], ["♥", "Interested"]].map(([icon, label], i) => (
              <span
                key={label}
                className={`flex h-12 items-center gap-2 rounded-full px-4 text-sm font-medium shadow-sm ${i === 2 ? "bg-signal text-white" : "bg-white text-ink"}`}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-line bg-ink py-4 text-paper">
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-2xl italic">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-10">
              {m} <span className="text-signal not-italic">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
          <h2 className="font-display text-5xl leading-[0.95] tracking-tight">
            Research in one tool. <span className="italic text-ink-soft">Cold-message in another.</span>
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              Today a founder builds an investor list in a database, then guesses who is still active, then sends
              connection requests that mostly go unanswered. Investors scroll through hundreds of decks to find a few
              inside their thesis.
            </p>
            <p className="text-ink">
              Fledge puts fit and contact in one flow: <strong className="font-semibold">discover → evaluate → match → connect.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-paper-deep/70 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">How it works</p>
          <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
            {steps.map((s) => (
              <article key={s.n} className="group bg-paper p-7 transition hover:bg-white">
                <span className="font-mono text-sm text-signal">{s.n}</span>
                <h3 className="mt-10 font-display text-2xl leading-tight">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Two sides */}
      <section id="sides" className="mx-auto grid max-w-6xl gap-6 px-5 py-24 md:grid-cols-2">
        <article className="flex flex-col rounded-[28px] bg-ink p-9 text-paper">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/50">For founders</p>
          <h3 className="mt-6 font-display text-4xl leading-tight">Investors who fit — not just investor names.</h3>
          <ul className="mt-8 space-y-3 text-paper/80">
            <li>· Feed ranked by stage, sector, geography and cheque size</li>
            <li>· Your identity and deck stay private until a match</li>
            <li>· See who saved or showed interest</li>
          </ul>
          <Link href="/signup?role=founder" className="mt-10 inline-flex w-fit rounded-full bg-signal px-6 py-3 font-medium text-white transition hover:bg-paper hover:text-ink">
            Create startup profile →
          </Link>
        </article>
        <article className="flex flex-col rounded-[28px] border-2 border-ink p-9">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">For investors</p>
          <h3 className="mt-6 font-display text-4xl leading-tight">Deal flow filtered by your thesis.</h3>
          <ul className="mt-8 space-y-3 text-ink-soft">
            <li>· Structured startup cards you can screen in seconds</li>
            <li>· AI assistant: key metrics, strengths &amp; risks, comparables</li>
            <li>· Only founders who want to talk to you reach out</li>
          </ul>
          <Link href="/signup?role=investor" className="mt-10 inline-flex w-fit rounded-full bg-ink px-6 py-3 font-medium text-paper transition hover:bg-signal">
            Set investment thesis →
          </Link>
        </article>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-[32px] bg-signal px-8 py-16 text-white md:px-14">
          <h2 className="max-w-2xl font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.95] tracking-tight">
            The right match beats a hundred cold messages.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/signup?role=founder" className="rounded-full bg-ink px-6 py-3 font-medium text-paper transition hover:bg-paper hover:text-ink">I&apos;m a founder</Link>
            <Link href="/signup?role=investor" className="rounded-full border-2 border-white px-6 py-3 font-medium transition hover:bg-white hover:text-signal">I&apos;m an investor</Link>
          </div>
          <svg className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 opacity-20" viewBox="0 0 32 32" aria-hidden>
            <path d="M4 22c6-1 10-6 12-14 2 8 6 13 12 14-6 2-9 4-12 6-3-2-6-4-12-6z" fill="white" />
          </svg>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-ink-soft sm:flex-row sm:items-center">
          <Logo />
          <p>Product Analytics · KBTU · 2026 — MVP prototype</p>
        </div>
      </footer>
    </main>
  );
}
