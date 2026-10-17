import {
  INVESTOR_TYPE_LABEL,
  STAGE_LABEL,
  usd,
  type InvestorCard,
  type StartupCard,
} from "@/lib/catalog";
import type { Fit } from "@/lib/scoring";

export function DemoBadge() {
  return (
    <span
      className="rounded-full border border-dashed border-current px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70"
      title="Demo profile for the prototype — not a real company"
    >
      Demo
    </span>
  );
}

function FitBadge({ fit }: { fit: Fit }) {
  return (
    <span className="rounded-full bg-signal/15 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-signal">
      {fit.score}% fit
    </span>
  );
}

function Reasons({ fit, dark = false }: { fit: Fit; dark?: boolean }) {
  if (!fit.reasons.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-1.5 text-[11px]">
      {fit.reasons.map((r) => (
        <li
          key={r}
          className={`rounded-full px-2.5 py-1 ${dark ? "bg-paper/10 text-paper/80" : "bg-moss/10 text-moss"}`}
        >
          ✓ {r}
        </li>
      ))}
    </ul>
  );
}

function LockedNote({ text }: { text: string }) {
  return (
    <p className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-current/30 px-3 py-2 text-xs opacity-70">
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="7" width="10" height="7" rx="1.5" />
        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
      </svg>
      {text}
    </p>
  );
}

export function StartupCardView({ s, fit, locked = true }: { s: StartupCard; fit?: Fit; locked?: boolean }) {
  return (
    <article className="rounded-[26px] border border-ink/15 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(20,38,31,0.45)] sm:p-7">
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
        <span>Startup · {STAGE_LABEL[s.stage]}</span>
        <span className="flex items-center gap-2">
          {s.is_demo && <DemoBadge />}
          {fit && <FitBadge fit={fit} />}
        </span>
      </div>
      <h2 className="mt-5 font-display text-4xl leading-none">{s.name}</h2>
      <p className="mt-3 text-ink-soft">{s.pitch}</p>
      {s.problem && <p className="mt-3 text-sm leading-relaxed text-ink-soft/90">{s.problem}</p>}
      <dl className="mt-6 grid grid-cols-2 gap-2.5 text-sm sm:grid-cols-3">
        {[
          ["Industry", s.industry],
          ["Geography", s.geography],
          ["Raising", s.funding_target_usd ? usd(s.funding_target_usd) : "—"],
          ["Traction", s.traction_range],
          ["Team", !s.team_size ? "—" : s.team_size === 1 ? "Solo founder" : `${s.team_size} people`],
          ["Wants", s.looking_for.map((t) => INVESTOR_TYPE_LABEL[t]).join(", ") || "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-paper px-3 py-2">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{k}</dt>
            <dd className="mt-0.5 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {fit && <Reasons fit={fit} />}
      {locked && <LockedNote text="Founder identity, deck and detailed metrics unlock after a match" />}
    </article>
  );
}

export function InvestorCardView({ i, fit, locked = true }: { i: InvestorCard; fit?: Fit; locked?: boolean }) {
  return (
    <article className="rounded-[26px] bg-moss p-6 text-paper shadow-[0_30px_60px_-30px_rgba(20,38,31,0.7)] sm:p-7">
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">
        <span>Investor · {INVESTOR_TYPE_LABEL[i.investor_type]}</span>
        <span className="flex items-center gap-2">
          {i.is_demo && <DemoBadge />}
          {fit && <FitBadge fit={fit} />}
        </span>
      </div>
      <h2 className="mt-5 font-display text-4xl leading-none">{i.display_name}</h2>
      <p className="mt-3 text-paper/75">{i.thesis}</p>
      <dl className="mt-6 grid grid-cols-2 gap-2.5 text-sm">
        {[
          ["Ticket", i.ticket_min_usd ? `${usd(i.ticket_min_usd)}–${usd(i.ticket_max_usd)}` : "—"],
          ["Stages", i.stages.map((s) => STAGE_LABEL[s]).join(", ")],
          ["Sectors", i.industries.join(", ")],
          ["Geography", i.geographies.join(", ")],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-paper/10 px-3 py-2">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-paper/50">{k}</dt>
            <dd className="mt-0.5 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {i.portfolio && <p className="mt-4 text-sm text-paper/60">Portfolio: {i.portfolio}</p>}
      {fit && <Reasons fit={fit} dark />}
      {locked && <LockedNote text="Direct contacts unlock after a match" />}
    </article>
  );
}
