// Landing page. Techniques: split-converge headline, layered atmosphere (grid · glows · sparks),
// pointer-tilt card stack, word-by-word scroll lighting, dot infographic, pinned scroll story,
// animated fit-score gauge, pop-in comparison, staggered market rings, iris-reveal CTA.
// Motion engine: src/components/landing/motion.tsx. Static under prefers-reduced-motion.
import Link from "next/link";
import { Constellation } from "@/components/landing/constellation";
import { LandingMotion } from "@/components/landing/motion";
import { StickyCta } from "@/components/landing/sticky-cta";
import { SwipeDemo } from "@/components/landing/swipe-demo";
import { Logo } from "@/components/logo";
import { PageView, TrackedLink } from "@/components/public-track";

const marquee = ["Pre-seed", "Seed", "Fintech", "B2B SaaS", "Edtech", "Almaty", "Astana", "Tashkent", "Bishkek", "Angels", "Accelerators", "Climate", "Marketplaces"];

const PROBLEM =
  "A founder builds an investor list in one tool, guesses who is still active, then cold-messages people in another. Most messages are never answered. Investors scroll hundreds of decks to find the few that fit their thesis.";

const STORY = [
  { n: "01", title: "Structured profile", body: "Stage, sector, geography, raise or ticket size — in two minutes, not a 40-page deck." },
  { n: "02", title: "Ranked feed", body: "Every card is scored for fit, so the first cards you see are the relevant ones." },
  { n: "03", title: "Pass · Save · Interested", body: "Three actions. Nobody receives a message they did not ask for." },
  { n: "04", title: "Mutual match unlocks", body: "Interest on both sides opens identity, deck, metrics and a private chat." },
];

const COMPARE: { row: string; li: boolean | string; cb: boolean | string; fl: boolean | string }[] = [
  { row: "Structured investor data (stage, ticket)", li: false, cb: true, fl: true },
  { row: "Ranked by fit to your startup", li: false, cb: false, fl: true },
  { row: "Contact inside the product", li: "capped", cb: false, fl: true },
  { row: "Only mutual interest, no cold messages", li: false, cb: false, fl: true },
  { row: "Free for the core flow", li: "partly", cb: "partly", fl: true },
];

const FAQ = [
  { q: "Is Fledge free?", a: "Yes. Everything in the beta is free: profile, ranked feed, matches and chat. Later, paid tools will add productivity features — never a higher ranking." },
  { q: "Who can see my startup's details?", a: "Every signed-in user sees the card: pitch, stage, sector, geography and raise. Your name, LinkedIn, deck, metrics and contacts open only to an investor you matched with." },
  { q: "How is the fit score calculated?", a: "Four public rules: industry match (35), stage match (30), geography covered (20) and a cheque that fits the raise (15). No hidden signals and no paid boosts." },
  { q: "Are the investors on Fledge real?", a: "Fledge is an MVP. Real founders and investors are joining now; profiles marked DEMO are examples so you can try the flow. Demo matches are never counted as real ones." },
  { q: "Can I use it outside Kazakhstan?", a: "Yes, but we start with Kazakhstan and Central Asia, where we know the ecosystem. You can choose CIS or Global as your geography." },
];

const RAIL = [
  { name: "Tenge Ledger", pitch: "Automated bookkeeping for small businesses.", stage: "Seed", fit: 92, industry: "Fintech", geo: "Kazakhstan" },
  { name: "Tumar AI", pitch: "AI support agents that speak Kazakh.", stage: "Seed", fit: 85, industry: "AI/ML", geo: "Central Asia" },
  { name: "Caravan Freight", pitch: "Digital freight matching for trucking.", stage: "Seed", fit: 80, industry: "Logistics", geo: "Central Asia" },
  { name: "Qadam Learn", pitch: "Coding courses in Kazakh and Russian.", stage: "Pre-seed", fit: 70, industry: "Edtech", geo: "Kazakhstan" },
  { name: "AgroScan", pitch: "Drone crop monitoring for wheat farms.", stage: "Seed", fit: 65, industry: "Agritech", geo: "Kazakhstan" },
  { name: "Shipa Health", pitch: "Clinic booking with verified reviews.", stage: "Pre-seed", fit: 55, industry: "Healthtech", geo: "Uzbekistan" },
  { name: "PayRoute", pitch: "Cross-border payroll for CIS teams.", stage: "Series A", fit: 50, industry: "Fintech", geo: "CIS" },
  { name: "GreenSteppe", pitch: "Solar micro-grids for remote farms.", stage: "Idea", fit: 35, industry: "Climate", geo: "Kazakhstan" },
];

const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53) % 100,
  dur: 7 + ((i * 7) % 9),
  delay: -((i * 13) % 12),
  size: 2 + (i % 3),
}));

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

function Mark({ v, d }: { v: boolean | string; d: number }) {
  if (v === true)
    return (
      <span data-reveal="pop" className="pop inline-grid h-8 w-8 place-items-center rounded-full bg-signal text-white" style={{ "--d": d } as Vars}>
        ✓
      </span>
    );
  if (v === false) return <span className="text-ink/25">—</span>;
  return <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">{v}</span>;
}

function HeroCards() {
  return (
    <div data-tilt className="relative mx-auto h-[440px] w-full max-w-[400px]">
      <div className="absolute inset-x-8 bottom-6 top-20 rotate-6 rounded-[28px] bg-paper/10 backdrop-blur" />
      {/* investor card, swiped away */}
      <div className="card-pass absolute right-0 top-0 w-[270px] rounded-[22px] border border-paper/15 bg-moss p-5 text-paper shadow-2xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">Investor · Angel</div>
        <h3 className="mt-4 font-display text-3xl leading-none">Steppe Angels</h3>
        <p className="mt-2 text-sm text-paper/70">Pre-seed to seed, Central Asia, $25–100K tickets.</p>
      </div>
      {/* startup card, matched */}
      <div className="card-match absolute left-4 top-12 w-[300px] rounded-[22px] bg-white p-5 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
          <span>Startup · Seed</span>
          <span className="rounded-full bg-signal/15 px-2 py-0.5 text-signal">92% fit</span>
        </div>
        <h3 className="mt-4 font-display text-3xl leading-none">Tenge Ledger</h3>
        <p className="mt-2 text-sm text-ink-soft">Automated bookkeeping for SMBs in Kazakhstan.</p>
        <dl className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
          {[["Industry", "Fintech"], ["Geo", "Almaty"], ["Raising", "$300K"], ["Traction", "$10–50K MRR"]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-paper px-3 py-2">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-xl border border-dashed border-ink/25 px-3 py-2 text-xs text-ink-soft">🔒 Identity &amp; deck unlock after match</p>
      </div>
      <div className="stamp absolute left-1/2 top-1/2 z-10 whitespace-nowrap rounded-xl border-4 border-signal bg-ink/40 px-5 py-2 font-display text-4xl font-semibold italic text-signal backdrop-blur-sm">
        It&apos;s a match
      </div>
      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-3">
        {[["✕", "Pass"], ["☆", "Save"], ["♥", "Interested"]].map(([icon, label], i) => (
          <span key={label} className={`flex h-12 items-center gap-2 rounded-full px-4 text-sm font-medium shadow-lg ${i === 2 ? "bg-signal text-white" : "bg-white text-ink"}`}>
            <span aria-hidden>{icon}</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const words = PROBLEM.split(" ");
  // ~200 messages, under 3% answered → 6 lit dots (Assignment 3, respondent R4)
  const hitList = [17, 54, 88, 121, 149, 186];
  const hits = new Set(hitList);

  return (
    <main id="top" className="overflow-x-clip">
      <PageView name="landing_viewed" />
      <LandingMotion />
      <StickyCta />

      {/* ======================================================= HERO (dark, layered) */}
      <section data-spotlight className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-paper">
        {/* depth-2: live founder–investor network */}
        <Constellation />
        {/* depth-4: light that follows the pointer */}
        <div aria-hidden className="spotlight pointer-events-none absolute inset-0 -z-10" />
        {/* depth-0: grid */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(var(--paper) 1px, transparent 1px), linear-gradient(90deg, var(--paper) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at 60% 40%, black, transparent 70%)",
          }}
        />
        {/* depth-1: glows */}
        <div aria-hidden className="absolute inset-0 -z-20">
          <div className="glow left-[55%] top-[10%] h-[38vw] w-[38vw] bg-signal/35" />
          <div className="glow left-[-10%] top-[45%] h-[34vw] w-[34vw] bg-[#1f8a62]/40" style={{ animationDelay: "-6s" }} />
        </div>
        {/* depth-5: sparks */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {SPARKS.map((s, i) => (
            <span key={i} className="spark" style={{ left: `${s.left}%`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`, width: s.size, height: s.size }} />
          ))}
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Logo inverted />
          <nav className="flex items-center gap-1 whitespace-nowrap text-sm sm:gap-2">
            <a href="#how" className="hidden px-3 py-2 text-paper/60 hover:text-paper sm:inline">How it works</a>
            <a href="#try" className="hidden px-3 py-2 text-paper/60 hover:text-paper sm:inline">Try it</a>
            <a href="#faq" className="hidden px-3 py-2 text-paper/60 hover:text-paper lg:inline">FAQ</a>
            <Link href="/login" className="px-2 py-2 font-medium hover:text-signal sm:px-3">Log in</Link>
            <TrackedLink data-magnetic cta="nav_join" href="/signup" className="rounded-full bg-paper px-3 py-2 font-medium text-ink sm:px-4 transition hover:bg-signal hover:text-white">
              Join free
            </TrackedLink>
          </nav>
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-8 md:grid-cols-[1.15fr_1fr] md:pt-14">
          <div>
            <p className="rise font-mono text-xs uppercase tracking-[0.25em] text-paper/50">Founder ↔ investor matching · Central Asia</p>
            <h1 className="mt-6 font-display text-[clamp(3.2rem,8.5vw,7rem)] font-medium leading-[0.9] tracking-[-0.035em]">
              <span className="converge-l" style={{ "--d": 100 } as Vars}>Stop</span>{" "}
              <span className="converge-r" style={{ "--d": 220 } as Vars}>cold-</span>
              <br />
              <span className="converge-l" style={{ "--d": 340 } as Vars}>pitching.</span>
              <br />
              <em className="converge-r font-normal italic" style={{ "--d": 520 } as Vars}>
                <span className="sheen">Start matching.</span>
              </em>
            </h1>
            <p className="rise mt-8 max-w-md text-lg leading-relaxed text-paper/70" style={{ animationDelay: "700ms" }}>
              Fledge shows founders the investors who fit their stage, sector and raise — and shows investors only
              startups inside their thesis. You connect when interest is mutual.
            </p>
            <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "850ms" }}>
              <TrackedLink data-magnetic cta="hero_founder" href="/signup?role=founder" className="group inline-flex items-center justify-between gap-6 rounded-2xl bg-signal px-6 py-4 text-white transition hover:bg-paper hover:text-ink">
                <span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">I&apos;m raising</span>
                  <span className="text-lg font-medium">Join as founder</span>
                </span>
                <span className="text-2xl transition group-hover:translate-x-1">→</span>
              </TrackedLink>
              <TrackedLink data-magnetic cta="hero_investor" href="/signup?role=investor" className="group inline-flex items-center justify-between gap-6 rounded-2xl border-2 border-paper/40 px-6 py-4 transition hover:border-paper">
                <span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">I&apos;m investing</span>
                  <span className="text-lg font-medium">Join as investor</span>
                </span>
                <span className="text-2xl transition group-hover:translate-x-1">→</span>
              </TrackedLink>
            </div>
            <ul className="rise mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-paper/60" style={{ animationDelay: "1000ms" }}>
              {["Free during beta", "1-minute setup", "Identity hidden until a match"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-signal/25 text-[10px] text-signal">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rise" style={{ animationDelay: "400ms" }}>
            <div className="float-y">
              <HeroCards />
            </div>
          </div>
        </div>

        <a href="#problem" aria-label="Scroll down" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 md:flex">
          scroll
          <span className="h-10 w-px animate-pulse bg-paper/40" />
        </a>
      </section>

      {/* marquee */}
      <div className="border-y border-line bg-signal py-4 text-white">
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-2xl italic">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-10">
              {m} <span className="not-italic text-ink">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ======================================================= PROOF STRIP */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line md:grid-cols-4">
          {[
            { v: 6, s: "", label: "founder interviews behind the product" },
            { v: 4, s: "", label: "transparent rules rank every card" },
            { v: 0, s: "", label: "cold messages — contact only after a match" },
            { v: 1, s: " min", label: "to create your profile" },
          ].map((x, i) => (
            <div key={x.label} data-reveal="up" className="bg-paper px-6 py-8" style={{ "--d": i * 100 } as Vars}>
              <p className="font-display text-5xl leading-none">
                <span data-count={x.v}>{x.v}</span>
                {x.s}
              </p>
              <p className="mt-3 text-sm text-ink-soft">{x.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================= PROBLEM: word lighting */}
      <section id="problem" data-scrub className="mx-auto max-w-5xl px-5 py-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft" data-scramble>The problem</p>
        <p className="light-words mt-8 font-display text-[clamp(1.9rem,4.2vw,3.4rem)] leading-[1.12] tracking-tight" style={{ "--n": words.length } as Vars}>
          {words.map((w, i) => (
            <span key={i} style={{ "--i": i } as Vars}>
              {w}{" "}
            </span>
          ))}
        </p>
      </section>

      {/* ======================================================= INFOGRAPHIC: evidence */}
      <section id="evidence" className="relative isolate overflow-hidden bg-ink py-28 text-paper">
        <div aria-hidden className="glow -right-[10%] top-0 -z-10 h-[30vw] w-[30vw] bg-signal/25" />
        <div className="mx-auto max-w-6xl px-5">
          <p data-reveal="up" className="font-mono text-xs uppercase tracking-[0.2em] text-paper/50" data-scramble>What founders told us</p>
          <h2 data-reveal="up" className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.95] tracking-tight" style={{ "--d": 120 } as Vars}>
            Cold outreach is a numbers game nobody wins.
          </h2>

          <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div data-reveal="up" className="dots grid gap-[6px]" style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }} aria-hidden>
                {Array.from({ length: 200 }, (_, i) => (
                  <i key={i} className={hits.has(i) ? "hit" : ""} style={{ "--d": Math.max(0, hitList.indexOf(i)) * 160 } as Vars} />
                ))}
              </div>
              <p className="mt-6 flex items-baseline gap-4">
                <span className="font-display text-7xl text-signal">
                  &lt;<span data-count="3" data-suffix="%">3%</span>
                </span>
                <span className="text-paper/70">
                  replied to ~<b className="text-paper">200</b> LinkedIn messages from one founder. Each dot is a message.
                </span>
              </p>
            </div>

            <div className="space-y-10">
              <div data-reveal="up" className="grow-host">
                <p className="flex items-baseline justify-between gap-4">
                  <span className="text-paper/70">Investors on a 120-name list that were usable</span>
                  <span className="font-display text-4xl">~<span data-count="50" data-suffix="%">50%</span></span>
                </p>
                <div className="mt-3 flex h-4 gap-[2px] overflow-hidden rounded">
                  <span className="grow h-full w-1/2 rounded-l bg-signal" />
                  <span className="grow h-full w-1/2 rounded-r bg-paper/15" style={{ "--d": 300 } as Vars} />
                </div>
                <p className="mt-2 text-xs text-paper/40">the other half: inactive, wrong stage or unreachable</p>
              </div>
              <div data-reveal="up" className="grow-host" style={{ "--d": 150 } as Vars}>
                <p className="text-paper/70">Where the job is split today</p>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ["Crunchbase", "who fits — no way to contact", 55],
                    ["LinkedIn", "how to reach — no fit data, capped notes", 45],
                  ].map(([name, note, w], i) => (
                    <div key={name as string}>
                      <div className="flex justify-between gap-4">
                        <b>{name}</b>
                        <span className="text-right text-paper/50">{note}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded bg-paper/10">
                        <span className="grow block h-full rounded bg-paper/60" style={{ width: `${w}%`, "--d": 200 + i * 200 } as Vars} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="flex justify-between gap-4">
                      <b className="text-signal">Fledge</b>
                      <span className="text-right text-paper/50">fit + mutual contact in one flow</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded bg-paper/10">
                      <span className="grow block h-full w-full rounded bg-signal" style={{ "--d": 700 } as Vars} />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-paper/40">Source: founder interviews R2, R4 (Assignment 3) and competitor walkthroughs (Assignment 4).</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= PINNED STORY */}
      <section id="how" data-scrub="pin" data-steps="4" className="relative h-[260vh]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft" data-scramble>How it works</p>
              <ol className="mt-8 space-y-7">
                {STORY.map((s, i) => (
                  <li key={s.n} className={`story-step s-${i} flex gap-5`}>
                    <span className="font-mono text-sm text-signal">{s.n}</span>
                    <div>
                      <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight">{s.title}</h3>
                      <p className="mt-1 max-w-sm text-ink-soft">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 h-1 w-full max-w-sm overflow-hidden rounded bg-paper-deep">
                <span className="block h-full origin-left rounded bg-signal" style={{ transform: "scaleX(var(--p, 0))" }} />
              </div>
            </div>

            {/* phone */}
            <div className="relative mx-auto hidden h-[540px] w-[290px] rounded-[44px] border-[10px] border-ink bg-paper shadow-[0_50px_100px_-40px_rgba(20,38,31,0.8)] sm:block">
              <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
              <div className="absolute inset-0 overflow-hidden rounded-[34px]">
                {/* 0: profile */}
                <div className="story-screen s-0 absolute inset-4 top-10 space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Your startup</p>
                  {[["Name", "Tenge Ledger"], ["Industry", "Fintech"], ["Stage · geo", "Seed · Kazakhstan"], ["Funding", "$300K raise"]].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm">
                      <span className="block font-mono text-[9px] uppercase text-ink-soft">{k}</span>
                      {v}
                    </div>
                  ))}
                  <div className="rounded-xl bg-signal py-3 text-center text-sm font-medium text-white">Save profile</div>
                </div>
                {/* 1: ranked feed */}
                <div className="story-screen s-1 absolute inset-4 top-10 space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Ranked for you</p>
                  {[["Steppe Angels", 100], ["Silk Road Ventures", 85], ["Eurasia Seed", 65], ["Nomad Climate", 35]].map(([n, s]) => (
                    <div key={n as string} className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm shadow-sm">
                      {n}
                      <span className="rounded-full bg-signal/15 px-2 font-mono text-[11px] text-signal">{s}%</span>
                    </div>
                  ))}
                </div>
                {/* 2: swipe */}
                <div className="story-screen s-2 absolute inset-4 top-10">
                  <div className="rotate-6 rounded-2xl bg-moss p-4 text-paper shadow-xl">
                    <p className="font-mono text-[10px] uppercase text-paper/60">Angel · 100% fit</p>
                    <p className="mt-3 font-display text-2xl">Steppe Angels</p>
                    <p className="mt-2 text-xs text-paper/70">Pre-seed to seed, Central Asia.</p>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
                    <span className="rounded-xl bg-white py-3">✕</span>
                    <span className="rounded-xl bg-white py-3">☆</span>
                    <span className="rounded-xl bg-signal py-3 text-white ring-4 ring-signal/30">♥</span>
                  </div>
                </div>
                {/* 3: match */}
                <div className="story-screen s-3 absolute inset-4 top-10 text-center">
                  <p className="mx-auto mt-10 inline-block -rotate-6 rounded-xl border-4 border-signal px-4 py-1 font-display text-3xl italic text-signal">It&apos;s a match</p>
                  <div className="mt-8 space-y-2 text-left text-xs">
                    <p className="w-4/5 rounded-2xl rounded-bl-sm bg-paper-deep px-3 py-2">Hi! Your thesis fits our seed round.</p>
                    <p className="ml-auto w-4/5 rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-paper">Great — call on Tuesday?</p>
                  </div>
                  <p className="mt-6 rounded-xl border border-dashed border-signal/50 px-3 py-2 text-[11px] text-ink-soft">🔓 Deck, LinkedIn and contacts unlocked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= TRY IT: playable swipe */}
      <section id="try" className="relative isolate overflow-hidden bg-paper-deep/60 py-28">
        <div aria-hidden className="glow -left-[10%] top-[20%] -z-10 h-[28vw] w-[28vw] bg-signal/20" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft" data-scramble>Try it now</p>
            <h2 data-reveal="up" className="mt-4 font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.95] tracking-tight">
              Swipe like a founder. <em className="italic text-signal">Feel the match.</em>
            </h2>
            <p data-reveal="up" className="mt-6 max-w-md text-lg text-ink-soft" style={{ "--d": 120 } as Vars}>
              Drag a card right if the investor fits, left if not. Some of them are interested in you too.
            </p>
          </div>
          <div data-reveal="scale">
            <SwipeDemo />
          </div>
        </div>
      </section>

      {/* ======================================================= HORIZONTAL RAIL */}
      <section data-scrub="pin" data-rail className="relative h-[210vh] bg-ink text-paper">
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/50" data-scramble>Inside the feed</p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[0.95] tracking-tight">
              Every card answers <em className="italic text-signal">&ldquo;does this fit?&rdquo;</em>
            </h2>
          </div>
          <div className="rail-track mt-12 flex w-max gap-6 px-5 md:px-[max(20px,calc((100vw-72rem)/2+20px))]">
            {RAIL.map((c, i) => (
              <article
                key={c.name}
                className={`w-[300px] shrink-0 rounded-[24px] p-6 ${i % 3 === 0 ? "bg-paper text-ink" : i % 3 === 1 ? "bg-moss text-paper" : "bg-signal text-white"}`}
                style={{ rotate: `${(i % 2 ? 1 : -1) * 1.5}deg` }}
              >
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] opacity-70">
                  <span>{c.stage}</span>
                  <span>{c.fit}% fit</span>
                </div>
                <h3 className="mt-6 font-display text-3xl leading-none">{c.name}</h3>
                <p className="mt-3 text-sm opacity-80">{c.pitch}</p>
                <div className="mt-6 h-1.5 rounded-full bg-current/15">
                  <span className="block h-full rounded-full bg-current" style={{ width: `${c.fit}%` }} />
                </div>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-wider opacity-60">{c.industry} · {c.geo}</p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-10 w-full max-w-6xl px-5 text-xs text-paper/40">Demo profiles from the prototype · scroll to move the rail</p>
        </div>
      </section>

      {/* ======================================================= FIT SCORE INFOGRAPHIC */}
      <section id="why" className="bg-paper-deep/60 py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
          <div data-reveal="scale" className="relative mx-auto aspect-square w-full max-w-[380px]">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--line)" strokeWidth="10" pathLength={100} />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--signal)" strokeWidth="10" strokeLinecap="round" pathLength={100} strokeDasharray="100 100" className="gauge-arc" style={{ "--v": 92 } as Vars} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-8xl leading-none">
                  <span data-count="92">92</span>
                  <span className="text-4xl">%</span>
                </p>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">fit score</p>
              </div>
            </div>
          </div>
          <div>
            <p data-reveal="up" className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft" data-scramble>Transparent ranking</p>
            <h2 data-reveal="up" className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-tight" style={{ "--d": 100 } as Vars}>
              No black box. <em className="italic text-signal">Four rules.</em>
            </h2>
            <div data-reveal="up" className="grow-host mt-10 space-y-5" style={{ "--d": 200 } as Vars}>
              {[
                ["Industry match", 35],
                ["Stage match", 30],
                ["Geography covered", 20],
                ["Ticket fits the raise", 15],
              ].map(([label, w], i) => (
                <div key={label as string}>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="font-mono text-ink-soft">+{w}</span>
                  </p>
                  <div className="mt-2 h-3 rounded-full bg-white">
                    <span className="grow block h-full rounded-full bg-ink" style={{ width: `${(Number(w) / 35) * 100}%`, "--d": 300 + i * 180 } as Vars} />
                  </div>
                </div>
              ))}
            </div>
            <p data-reveal="up" className="mt-6 text-sm text-ink-soft">Paid plans never buy a higher score — ranking stays about fit.</p>
          </div>
        </div>
      </section>

      {/* ======================================================= BENEFITS BY ROLE */}
      <section id="benefits" className="mx-auto grid max-w-6xl gap-6 px-5 py-28 md:grid-cols-2">
        {[
          {
            who: "For founders",
            title: "Investors who fit — not just investor names.",
            points: ["Feed ranked by stage, sector, geography and cheque", "Your identity and deck stay private until a match", "No more guessing who is still active"],
            cta: "Create startup profile",
            href: "/signup?role=founder",
            id: "benefit_founder",
            dark: true,
          },
          {
            who: "For investors",
            title: "Deal flow filtered by your thesis.",
            points: ["Structured cards you can screen in seconds", "Only founders who want to talk to you reach out", "Thesis written for you from a few taps"],
            cta: "Set investment thesis",
            href: "/signup?role=investor",
            id: "benefit_investor",
            dark: false,
          },
        ].map((b, i) => (
          <article
            key={b.who}
            data-reveal={i ? "right" : "left"}
            className={`flex flex-col rounded-[28px] p-9 ${b.dark ? "bg-ink text-paper" : "border-2 border-ink"}`}
          >
            <p className={`font-mono text-xs uppercase tracking-[0.2em] ${b.dark ? "text-paper/50" : "text-ink-soft"}`}>{b.who}</p>
            <h3 className="mt-6 font-display text-4xl leading-tight">{b.title}</h3>
            <ul className={`mt-8 space-y-3 ${b.dark ? "text-paper/80" : "text-ink-soft"}`}>
              {b.points.map((pt) => (
                <li key={pt} className="flex gap-3">
                  <span className="text-signal">✓</span>
                  {pt}
                </li>
              ))}
            </ul>
            <TrackedLink
              data-magnetic
              cta={b.id}
              href={b.href}
              className={`mt-10 inline-flex w-fit rounded-full px-6 py-3 font-medium transition ${b.dark ? "bg-signal text-white hover:bg-paper hover:text-ink" : "bg-ink text-paper hover:bg-signal"}`}
            >
              {b.cta} →
            </TrackedLink>
          </article>
        ))}
      </section>

      {/* ======================================================= COMPARISON */}
      <section id="compare" className="mx-auto max-w-5xl px-5 py-28">
        <h2 data-reveal="up" className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-tight">
          One flow instead of <em className="italic text-ink-soft">two tools.</em>
        </h2>
        <div data-reveal="up" className="mt-12 overflow-x-auto rounded-[28px] border border-line bg-white/70" style={{ "--d": 150 } as Vars}>
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                <th className="px-6 py-4 font-normal">
                  <span className="sr-only">Capability</span>
                </th>
                <th className="px-4 py-4 text-center font-normal">LinkedIn</th>
                <th className="px-4 py-4 text-center font-normal">Crunchbase</th>
                <th className="px-4 py-4 text-center font-normal text-signal">Fledge</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((c, i) => (
                <tr key={c.row} className="border-b border-line/60 last:border-0">
                  <td className="px-6 py-4 font-medium">{c.row}</td>
                  <td className="px-4 py-4 text-center"><Mark v={c.li} d={i * 90} /></td>
                  <td className="px-4 py-4 text-center"><Mark v={c.cb} d={i * 90 + 40} /></td>
                  <td className="bg-signal/5 px-4 py-4 text-center"><Mark v={c.fl} d={i * 90 + 80} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-ink-soft">Free-plan walkthroughs, Assignment 4.</p>
      </section>

      {/* ======================================================= MARKET RINGS */}
      <section id="market" className="bg-ink py-28 text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
          <div className="relative mx-auto aspect-square w-full max-w-[440px]" aria-hidden>
            {[
              { size: 100, label: "TAM", value: "~100,000", cls: "bg-paper/5 border-paper/15", top: "8%", d: 0 },
              { size: 62, label: "SAM", value: "300–500", cls: "bg-[#1f8a62]/25 border-[#1f8a62]/60", top: "10%", d: 250 },
              { size: 30, label: "SOM", value: "50–100", cls: "bg-signal border-signal", top: "28%", d: 500 },
            ].map((r) => (
              <div
                key={r.label}
                className="absolute left-1/2 top-1/2"
                style={{ width: `${r.size}%`, height: `${r.size}%`, transform: "translate(-50%, -50%)" }}
              >
                <div data-reveal="scale" className={`h-full w-full rounded-full border text-center ${r.cls}`} style={{ "--d": r.d } as Vars}>
                  <span className="relative block" style={{ top: r.top }}>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">{r.label}</span>
                    <span className="font-display text-2xl">{r.value}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <p data-reveal="up" className="font-mono text-xs uppercase tracking-[0.2em] text-paper/50" data-scramble>Start narrow</p>
            <h2 data-reveal="up" className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-tight" style={{ "--d": 100 } as Vars}>
              Kazakhstan first. <em className="italic text-signal">Then the region.</em>
            </h2>
            <ul data-reveal="up" className="mt-8 space-y-3 text-paper/70" style={{ "--d": 200 } as Vars}>
              <li><b className="text-paper">TAM</b> — ~100,000 founders and investors worldwide (Dealroom).</li>
              <li><b className="text-paper">SAM</b> — 300–500 early-stage founders and investors in Kazakhstan.</li>
              <li><b className="text-paper">SOM</b> — 50–100 first users through local communities and events.</li>
            </ul>
            <p className="mt-6 text-xs text-paper/40">Rings are not to scale. Estimates from Assignment 1.</p>
          </div>
        </div>
      </section>

      {/* ======================================================= FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-28">
        <h2 data-reveal="up" className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-tight">Questions</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQ.map((q) => (
            <details key={q.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium">
                {q.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/20 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-ink-soft">{q.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ======================================================= IRIS CTA */}
      <section data-scrub="pin" className="relative h-[160vh]">
        <div className="sticky top-0 grid h-[100svh] place-items-center overflow-hidden px-5">
          <div className="iris absolute inset-0 bg-signal" aria-hidden />
          {/* Text fades in once the circle covers it */}
          <div className="relative text-center text-white" style={{ opacity: "clamp(0, (var(--p, 1) - 0.32) * 4, 1)", transform: "translateY(calc((1 - clamp(0, (var(--p, 1) - 0.32) * 4, 1)) * 30px))" }}>
            <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.8rem,7vw,6rem)] leading-[0.92] tracking-tight">
              The right match beats a hundred cold messages.
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <TrackedLink data-magnetic cta="footer_founder" href="/signup?role=founder" className="rounded-full bg-ink px-7 py-4 text-lg font-medium text-paper transition hover:bg-paper hover:text-ink">
                I&apos;m a founder →
              </TrackedLink>
              <TrackedLink data-magnetic cta="footer_investor" href="/signup?role=investor" className="rounded-full border-2 border-white px-7 py-4 text-lg font-medium transition hover:bg-white hover:text-signal">
                I&apos;m an investor →
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 pb-28 pt-8 text-sm text-ink-soft sm:flex-row sm:items-center md:pb-8">
          <Logo />
          <p>Product Analytics · KBTU · 2026 — MVP prototype</p>
        </div>
      </footer>
    </main>
  );
}
