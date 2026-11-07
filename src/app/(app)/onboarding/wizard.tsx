"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";
import { InvestorCardView, StartupCardView } from "@/components/cards";
import { FormAlert } from "@/components/auth-shell";
import {
  GEOGRAPHIES,
  INDUSTRIES,
  INVESTOR_TYPES,
  INVESTOR_TYPE_LABEL,
  OTHER_INDUSTRY,
  STAGES,
  STAGE_LABEL,
  TRACTION_RANGES,
  type InvestorType,
  type Stage,
} from "@/lib/catalog";
import { saveFounder, saveInvestor, trackOnboardingStep, type OnboardingState } from "./actions";

// Draft answers survive a closed tab (per-browser convenience only).
// Quick onboarding: one small decision per screen, taps instead of typing, a live preview of
// the card, and only the fields the fit score needs. Contacts, deck and metrics come later.

// Quick picks only fill the exact amount fields; users can type any number.
const RAISES = [50_000, 100_000, 300_000, 500_000, 1_000_000];
const TICKETS = [
  { label: "$5–25K", min: 5_000, max: 25_000 },
  { label: "$25–100K", min: 25_000, max: 100_000 },
  { label: "$100–500K", min: 100_000, max: 500_000 },
  { label: "$500K–2M", min: 500_000, max: 2_000_000 },
];

const money = (n: number) => (n >= 1_000_000 ? `$${+(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`);

type Founder = {
  name: string;
  pitch: string;
  industry: string; // a listed industry or OTHER_INDUSTRY
  industryOther: string;
  stage: Stage | "";
  traction_range: string;
  team_size: number;
  funding_target_usd: number;
  geography: string; // a listed geography or OTHER_INDUSTRY
  geographyOther: string;
  looking_for: InvestorType[];
};
type Investor = {
  display_name: string;
  investor_type: InvestorType | "";
  industries: string[];
  otherOn: boolean;
  industriesOther: string; // comma separated
  stages: Stage[];
  geographies: string[];
  geoOtherOn: boolean;
  geographiesOther: string; // comma separated
  ticketMin: number;
  ticketMax: number;
  thesis: string;
};

const EMPTY_FOUNDER: Founder = {
  name: "", pitch: "", industry: "", industryOther: "", stage: "", traction_range: "", team_size: 0,
  funding_target_usd: 0, geography: "", geographyOther: "", looking_for: [],
};
const EMPTY_INVESTOR: Investor = {
  display_name: "", investor_type: "", industries: [], otherOn: false, industriesOther: "", stages: [], geographies: [], geoOtherOn: false, geographiesOther: "", ticketMin: 0, ticketMax: 0, thesis: "",
};

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-medium transition active:scale-[0.97] ${
        on ? "border-ink bg-ink text-paper shadow-md" : "border-ink/15 bg-white/70 hover:border-ink/50"
      }`}
    >
      {children}
    </button>
  );
}

// Dollar amount field: digits only, shown with thousands separators.
function MoneyInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-4 text-ink-soft">$</span>
      <input
        inputMode="numeric"
        aria-label={label}
        placeholder={label}
        value={value ? value.toLocaleString("en-US") : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          onChange(digits ? Number(digits) : 0);
        }}
        className="h-12 w-40 rounded-2xl border-2 border-ink/15 bg-white/80 pl-8 pr-3 text-lg font-medium outline-none focus:border-ink"
      />
    </label>
  );
}

// Exact team size: stepper with a number field and quick picks (usability feedback:
// ranges like "4–10" stored a made-up number).
function TeamSize({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const set = (n: number) => onChange(Math.max(1, Math.min(500, Math.round(n) || 1)));
  const btn = "grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink/15 bg-white/70 text-xl font-medium transition hover:border-ink disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" aria-label="Fewer people" className={btn} disabled={value <= 1} onClick={() => set((value || 1) - 1)}>
        <Minus className="size-5" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={500}
        aria-label="Team size"
        placeholder="0"
        value={value || ""}
        onChange={(e) => (e.target.value === "" ? onChange(0) : set(Number(e.target.value)))}
        className="h-12 w-20 rounded-2xl border-2 border-ink/15 bg-white/80 text-center text-lg font-medium outline-none focus:border-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" aria-label="More people" className={btn} disabled={value >= 500} onClick={() => set((value || 0) + 1)}>
        <Plus className="size-5" aria-hidden />
      </button>
      <span className="mx-1 h-6 w-px bg-ink/15" aria-hidden />
      {[1, 2, 3, 5, 10].map((n) => (
        <Chip key={n} on={value === n} onClick={() => set(n)}>
          {n === 1 ? "Solo" : n}
        </Chip>
      ))}
    </div>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
        {label} {hint && <span className="normal-case tracking-normal text-ink-soft/70">· {hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

const inputCls =
  "w-full rounded-2xl border-2 border-ink/15 bg-white/80 px-5 py-4 text-lg outline-none transition placeholder:text-ink/30 focus:border-ink focus:bg-white";

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function useDraft<T>(key: string, empty: T) {
  const [value, setValue] = useState<T>(empty);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue({ ...empty, ...JSON.parse(raw) });
    } catch {
      // storage blocked: start empty
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export function OnboardingWizard({ role, firstName }: { role: "founder" | "investor"; firstName: string }) {
  const founder = role === "founder";
  const [f, setF] = useDraft<Founder>("fledge_onb_founder", EMPTY_FOUNDER);
  const [inv, setInv] = useDraft<Investor>("fledge_onb_investor", EMPTY_INVESTOR);
  const [step, setStep] = useState(0);
  const [state, dispatch, pending] = useActionState<OnboardingState, FormData>(founder ? saveFounder : saveInvestor, {});
  const total = 4;

  useEffect(() => {
    void trackOnboardingStep(step + 1, total);
  }, [step]);

  const allInvestorIndustries = [
    ...inv.industries,
    ...(inv.otherOn ? inv.industriesOther.split(",").map((t) => t.trim()).filter((t) => t.length >= 2) : []),
  ];

  const allInvestorGeos = [
    ...inv.geographies,
    ...(inv.geoOtherOn ? inv.geographiesOther.split(",").map((t) => t.trim()).filter((t) => t.length >= 2) : []),
  ];

  // Thesis is optional: if left empty we write one from the choices.
  const autoThesis = useMemo(() => {
    const type = inv.investor_type ? INVESTOR_TYPE_LABEL[inv.investor_type] : "Investor";
    const inds = allInvestorIndustries.slice(0, 3).join(", ") || "early-stage startups";
    const st = inv.stages.map((s) => STAGE_LABEL[s]).join("–");
    const geo = allInvestorGeos.slice(0, 2).join(", ");
    return `${type} investing in ${inds}${st ? ` at ${st}` : ""}${geo ? ` in ${geo}` : ""}.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv]);

  const steps = founder
    ? [
        { title: "What are you building?", ok: f.name.trim().length >= 2 && f.pitch.trim().length >= 10 },
        { title: "Which industry?", ok: f.industry === OTHER_INDUSTRY ? f.industryOther.trim().length >= 2 : Boolean(f.industry) },
        { title: "Where are you now?", ok: Boolean(f.stage && f.traction_range && f.team_size >= 1 && f.team_size <= 500) },
        { title: "What are you raising?", ok: f.funding_target_usd > 0 && (f.geography === OTHER_INDUSTRY ? f.geographyOther.trim().length >= 2 : Boolean(f.geography)) },
      ]
    : [
        { title: "Who are you?", ok: inv.display_name.trim().length >= 2 && Boolean(inv.investor_type) },
        { title: "What do you invest in?", ok: inv.industries.length > 0 || (inv.otherOn && inv.industriesOther.trim().length >= 2) },
        { title: "Which stage and where?", ok: inv.stages.length > 0 && (inv.geographies.length > 0 || (inv.geoOtherOn && inv.geographiesOther.trim().length >= 2)) },
        { title: "Typical cheque?", ok: inv.ticketMin > 0 && inv.ticketMax >= inv.ticketMin },
      ];
  const current = steps[step];

  const submit = () => {
    const data = new FormData();
    if (founder) {
      data.set("name", f.name.trim());
      data.set("pitch", f.pitch.trim());
      data.set("industry", f.industry);
      if (f.industry === OTHER_INDUSTRY) data.set("industry_other", f.industryOther.trim());
      data.set("stage", f.stage);
      data.set("traction_range", f.traction_range);
      data.set("team_size", String(f.team_size));
      data.set("funding_target_usd", String(f.funding_target_usd));
      data.set("geography", f.geography);
      if (f.geography === OTHER_INDUSTRY) data.set("geography_other", f.geographyOther.trim());
      f.looking_for.forEach((t) => data.append("looking_for", t));
    } else {
      data.set("display_name", inv.display_name.trim());
      data.set("investor_type", inv.investor_type);
      inv.industries.forEach((x) => data.append("industries", x));
      if (inv.otherOn) data.set("industries_other", inv.industriesOther);
      inv.stages.forEach((x) => data.append("stages", x));
      inv.geographies.forEach((x) => data.append("geographies", x));
      if (inv.geoOtherOn) data.set("geographies_other", inv.geographiesOther);
      data.set("ticket_min_usd", String(inv.ticketMin));
      data.set("ticket_max_usd", String(inv.ticketMax));
      data.set("thesis", inv.thesis.trim().length >= 10 ? inv.thesis.trim() : autoThesis);
    }
    startTransition(() => dispatch(data));
  };

  const next = () => {
    if (!current.ok || pending) return;
    if (step < total - 1) setStep(step + 1);
    else submit();
  };

  const preview = founder ? (
    <StartupCardView
      s={{
        id: "preview", owner_id: null, is_demo: false, problem: "",
        name: f.name || "Your startup",
        pitch: f.pitch || "Your one-line pitch appears here.",
        industry: (f.industry === OTHER_INDUSTRY ? f.industryOther.trim() : f.industry) || "—",
        stage: (f.stage || "seed") as Stage,
        geography: (f.geography === OTHER_INDUSTRY ? f.geographyOther.trim() : f.geography) || "—",
        traction_range: f.traction_range || "—",
        funding_target_usd: f.funding_target_usd || 0,
        team_size: f.team_size,
        looking_for: f.looking_for,
      }}
    />
  ) : (
    <InvestorCardView
      i={{
        id: "preview", owner_id: null, is_demo: false, portfolio: "",
        display_name: inv.display_name || "Your name or fund",
        investor_type: (inv.investor_type || "angel") as InvestorType,
        thesis: inv.thesis.trim().length >= 10 ? inv.thesis : autoThesis,
        industries: allInvestorIndustries.length ? allInvestorIndustries : ["—"],
        stages: inv.stages.length ? inv.stages : (["seed"] as Stage[]),
        geographies: allInvestorGeos.length ? allInvestorGeos : ["—"],
        ticket_min_usd: inv.ticketMin,
        ticket_max_usd: Math.max(inv.ticketMin, inv.ticketMax),
      }}
    />
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <div
        onKeyDown={(e) => {
          if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
            e.preventDefault();
            next();
          }
        }}
      >
        {/* progress */}
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-signal" : "bg-paper-deep"}`} />
            ))}
          </div>
          <span className="font-mono text-xs text-ink-soft">
            {step + 1} / {total}
          </span>
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          {step === 0 ? `Hi ${firstName} · about 1 minute` : founder ? "Startup card" : "Investor card"}
        </p>
        <h1 key={current.title} className="rise mt-3 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.95] tracking-tight">
          {current.title}
        </h1>

        <div key={step} className="rise mt-8 space-y-7">
          {founder && step === 0 && (
            <>
              <input autoFocus className={inputCls} placeholder="Startup name" value={f.name} maxLength={80} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} />
              <div>
                <input
                  className={inputCls}
                  placeholder="One line: what you do and for whom"
                  value={f.pitch}
                  maxLength={140}
                  onChange={(e) => setF((p) => ({ ...p, pitch: e.target.value }))}
                />
                <p className="mt-2 flex justify-between text-xs text-ink-soft">
                  <span>e.g. “Automated bookkeeping for SMBs in Kazakhstan”</span>
                  <span className={f.pitch.length > 0 && f.pitch.length < 10 ? "text-signal" : ""}>{f.pitch.length}/140</span>
                </p>
              </div>
            </>
          )}
          {founder && step === 1 && (
            <>
              <Group label="Industry">
                {INDUSTRIES.map((x) => (
                  <Chip key={x} on={f.industry === x} onClick={() => { setF((p) => ({ ...p, industry: x })); setTimeout(() => setStep(2), 220); }}>{x}</Chip>
                ))}
                <Chip on={f.industry === OTHER_INDUSTRY} onClick={() => setF((p) => ({ ...p, industry: OTHER_INDUSTRY }))}>Other…</Chip>
              </Group>
              {f.industry === OTHER_INDUSTRY && (
                <div className="rise">
                  <input
                    autoFocus
                    className={inputCls}
                    placeholder="Type your industry, e.g. Gaming"
                    value={f.industryOther}
                    maxLength={40}
                    onChange={(e) => setF((p) => ({ ...p, industryOther: e.target.value }))}
                  />
                  <p className="mt-2 text-xs text-ink-soft">Investors who list the same industry will see a match on it.</p>
                </div>
              )}
            </>
          )}
          {founder && step === 2 && (
            <>
              <Group label="Stage">
                {STAGES.map((x) => <Chip key={x} on={f.stage === x} onClick={() => setF((p) => ({ ...p, stage: x }))}>{STAGE_LABEL[x]}</Chip>)}
              </Group>
              <Group label="Traction">
                {TRACTION_RANGES.map((x) => <Chip key={x} on={f.traction_range === x} onClick={() => setF((p) => ({ ...p, traction_range: x }))}>{x}</Chip>)}
              </Group>
              <Group label="Team size" hint="people, including you">
                <TeamSize value={f.team_size} onChange={(n) => setF((p) => ({ ...p, team_size: n }))} />
              </Group>
            </>
          )}
          {founder && step === 3 && (
            <>
              <Group label="Raising" hint="total round, USD">
                <MoneyInput value={f.funding_target_usd} onChange={(n) => setF((p) => ({ ...p, funding_target_usd: n }))} label="Round size" />
                {RAISES.map((n) => <Chip key={n} on={f.funding_target_usd === n} onClick={() => setF((p) => ({ ...p, funding_target_usd: n }))}>{money(n)}</Chip>)}
              </Group>
              <Group label="Based in">
                {GEOGRAPHIES.map((x) => <Chip key={x} on={f.geography === x} onClick={() => setF((p) => ({ ...p, geography: x }))}>{x}</Chip>)}
                <Chip on={f.geography === OTHER_INDUSTRY} onClick={() => setF((p) => ({ ...p, geography: OTHER_INDUSTRY }))}>Other…</Chip>
              </Group>
              {f.geography === OTHER_INDUSTRY && (
                <input
                  autoFocus
                  className={`${inputCls} rise`}
                  placeholder="Country or city, e.g. Tajikistan"
                  value={f.geographyOther}
                  maxLength={40}
                  onChange={(e) => setF((p) => ({ ...p, geographyOther: e.target.value }))}
                />
              )}
              <Group label="Looking for" hint="optional, empty = all">
                {INVESTOR_TYPES.map((x) => <Chip key={x} on={f.looking_for.includes(x)} onClick={() => setF((p) => ({ ...p, looking_for: toggle(p.looking_for, x) }))}>{INVESTOR_TYPE_LABEL[x]}</Chip>)}
              </Group>
            </>
          )}

          {!founder && step === 0 && (
            <>
              <input autoFocus className={inputCls} placeholder="Your name or fund name" value={inv.display_name} maxLength={80} onChange={(e) => setInv((p) => ({ ...p, display_name: e.target.value }))} />
              <Group label="You are">
                {INVESTOR_TYPES.map((x) => <Chip key={x} on={inv.investor_type === x} onClick={() => setInv((p) => ({ ...p, investor_type: x }))}>{INVESTOR_TYPE_LABEL[x]}</Chip>)}
              </Group>
            </>
          )}
          {!founder && step === 1 && (
            <>
              <Group label="Industries" hint="pick all that apply">
                {INDUSTRIES.map((x) => <Chip key={x} on={inv.industries.includes(x)} onClick={() => setInv((p) => ({ ...p, industries: toggle(p.industries, x) }))}>{x}</Chip>)}
                <Chip on={inv.otherOn} onClick={() => setInv((p) => ({ ...p, otherOn: !p.otherOn }))}>Other…</Chip>
              </Group>
              {inv.otherOn && (
                <div className="rise">
                  <input
                    autoFocus
                    className={inputCls}
                    placeholder="e.g. Gaming, Biotech (up to 3, comma separated)"
                    value={inv.industriesOther}
                    maxLength={130}
                    onChange={(e) => setInv((p) => ({ ...p, industriesOther: e.target.value }))}
                  />
                </div>
              )}
            </>
          )}
          {!founder && step === 2 && (
            <>
              <Group label="Stages">
                {STAGES.map((x) => <Chip key={x} on={inv.stages.includes(x)} onClick={() => setInv((p) => ({ ...p, stages: toggle(p.stages, x) }))}>{STAGE_LABEL[x]}</Chip>)}
              </Group>
              <Group label="Geographies">
                {GEOGRAPHIES.map((x) => <Chip key={x} on={inv.geographies.includes(x)} onClick={() => setInv((p) => ({ ...p, geographies: toggle(p.geographies, x) }))}>{x}</Chip>)}
                <Chip on={inv.geoOtherOn} onClick={() => setInv((p) => ({ ...p, geoOtherOn: !p.geoOtherOn }))}>Other…</Chip>
              </Group>
              {inv.geoOtherOn && (
                <input
                  autoFocus
                  className={`${inputCls} rise`}
                  placeholder="e.g. Tajikistan, Turkey (up to 3, comma separated)"
                  value={inv.geographiesOther}
                  maxLength={130}
                  onChange={(e) => setInv((p) => ({ ...p, geographiesOther: e.target.value }))}
                />
              )}
            </>
          )}
          {!founder && step === 3 && (
            <>
              <Group label="Cheque size" hint="USD per startup">
                <span className="flex items-center gap-2">
                  <MoneyInput value={inv.ticketMin} onChange={(n) => setInv((p) => ({ ...p, ticketMin: n }))} label="From" />
                  <span className="text-ink-soft">–</span>
                  <MoneyInput value={inv.ticketMax} onChange={(n) => setInv((p) => ({ ...p, ticketMax: n }))} label="To" />
                </span>
                {TICKETS.map((x) => (
                  <Chip key={x.label} on={inv.ticketMin === x.min && inv.ticketMax === x.max} onClick={() => setInv((p) => ({ ...p, ticketMin: x.min, ticketMax: x.max }))}>
                    {x.label}
                  </Chip>
                ))}
              </Group>
              {inv.ticketMin > 0 && inv.ticketMax > 0 && inv.ticketMax < inv.ticketMin && (
                <p role="alert" className="text-sm text-[#a8320a]">“To” must be at least “From”.</p>
              )}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">Thesis · optional</p>
                <textarea
                  className={`${inputCls} mt-3 resize-none text-base`}
                  rows={3}
                  maxLength={600}
                  placeholder={autoThesis}
                  value={inv.thesis}
                  onChange={(e) => setInv((p) => ({ ...p, thesis: e.target.value }))}
                />
                <p className="mt-2 text-xs text-ink-soft">Leave empty and we use the line above.</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-10 space-y-3">
          <FormAlert error={state.error} />
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 rounded-2xl border-2 border-ink/15 px-5 py-4 font-medium hover:border-ink">
                <ArrowLeft className="size-4" aria-hidden /> Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!current.ok || pending}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-signal px-6 py-4 text-lg font-medium text-white shadow-lg shadow-signal/25 transition hover:bg-ink disabled:bg-ink/20 disabled:shadow-none"
            >
              {pending ? (
                "Saving…"
              ) : (
                <>
                  {step < total - 1 ? "Continue" : founder ? "See matching investors" : "See matching startups"}
                  <ArrowRight className="size-5" aria-hidden />
                </>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-ink-soft">
            Press Enter to continue · contacts, deck and metrics can be added later
          </p>
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
          Live preview · how {founder ? "investors" : "founders"} see you
        </p>
        <div className="transition-all duration-300">{preview}</div>
      </aside>
    </div>
  );
}
