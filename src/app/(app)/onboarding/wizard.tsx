"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { InvestorCardView, StartupCardView } from "@/components/cards";
import { FormAlert } from "@/components/auth-shell";
import {
  GEOGRAPHIES,
  INDUSTRIES,
  INVESTOR_TYPES,
  INVESTOR_TYPE_LABEL,
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

const RAISES = [
  { label: "< $50K", value: 50_000 },
  { label: "$50–150K", value: 100_000 },
  { label: "$150–500K", value: 300_000 },
  { label: "$500K–1M", value: 750_000 },
  { label: "$1M+", value: 1_500_000 },
];
const TEAMS = [
  { label: "Solo", value: 1 },
  { label: "2–3", value: 3 },
  { label: "4–10", value: 7 },
  { label: "10+", value: 15 },
];
const TICKETS = [
  { label: "$5–25K", min: 5_000, max: 25_000 },
  { label: "$25–100K", min: 25_000, max: 100_000 },
  { label: "$100–500K", min: 100_000, max: 500_000 },
  { label: "$500K–2M", min: 500_000, max: 2_000_000 },
];

type Founder = {
  name: string;
  pitch: string;
  industry: string;
  stage: Stage | "";
  traction_range: string;
  team_size: number;
  funding_target_usd: number;
  geography: string;
  looking_for: InvestorType[];
};
type Investor = {
  display_name: string;
  investor_type: InvestorType | "";
  industries: string[];
  stages: Stage[];
  geographies: string[];
  ticket: number; // index in TICKETS
  thesis: string;
};

const EMPTY_FOUNDER: Founder = {
  name: "", pitch: "", industry: "", stage: "", traction_range: "", team_size: 0,
  funding_target_usd: 0, geography: "", looking_for: [],
};
const EMPTY_INVESTOR: Investor = {
  display_name: "", investor_type: "", industries: [], stages: [], geographies: [], ticket: -1, thesis: "",
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

  // Thesis is optional: if left empty we write one from the choices.
  const autoThesis = useMemo(() => {
    const type = inv.investor_type ? INVESTOR_TYPE_LABEL[inv.investor_type] : "Investor";
    const inds = inv.industries.slice(0, 3).join(", ") || "early-stage startups";
    const st = inv.stages.map((s) => STAGE_LABEL[s]).join("–");
    const geo = inv.geographies.slice(0, 2).join(", ");
    return `${type} investing in ${inds}${st ? ` at ${st}` : ""}${geo ? ` in ${geo}` : ""}.`;
  }, [inv]);

  const steps = founder
    ? [
        { title: "What are you building?", ok: f.name.trim().length >= 2 && f.pitch.trim().length >= 10 },
        { title: "Which industry?", ok: Boolean(f.industry) },
        { title: "Where are you now?", ok: Boolean(f.stage && f.traction_range && f.team_size) },
        { title: "What are you raising?", ok: Boolean(f.funding_target_usd && f.geography) },
      ]
    : [
        { title: "Who are you?", ok: inv.display_name.trim().length >= 2 && Boolean(inv.investor_type) },
        { title: "What do you invest in?", ok: inv.industries.length > 0 },
        { title: "Which stage and where?", ok: inv.stages.length > 0 && inv.geographies.length > 0 },
        { title: "Typical cheque?", ok: inv.ticket >= 0 },
      ];
  const current = steps[step];

  const submit = () => {
    const data = new FormData();
    if (founder) {
      data.set("name", f.name.trim());
      data.set("pitch", f.pitch.trim());
      data.set("industry", f.industry);
      data.set("stage", f.stage);
      data.set("traction_range", f.traction_range);
      data.set("team_size", String(f.team_size));
      data.set("funding_target_usd", String(f.funding_target_usd));
      data.set("geography", f.geography);
      f.looking_for.forEach((t) => data.append("looking_for", t));
    } else {
      const t = TICKETS[inv.ticket];
      data.set("display_name", inv.display_name.trim());
      data.set("investor_type", inv.investor_type);
      inv.industries.forEach((x) => data.append("industries", x));
      inv.stages.forEach((x) => data.append("stages", x));
      inv.geographies.forEach((x) => data.append("geographies", x));
      data.set("ticket_min_usd", String(t.min));
      data.set("ticket_max_usd", String(t.max));
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
        industry: f.industry || "—",
        stage: (f.stage || "seed") as Stage,
        geography: f.geography || "—",
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
        industries: inv.industries.length ? inv.industries : ["—"],
        stages: inv.stages.length ? inv.stages : (["seed"] as Stage[]),
        geographies: inv.geographies.length ? inv.geographies : ["—"],
        ticket_min_usd: inv.ticket >= 0 ? TICKETS[inv.ticket].min : 0,
        ticket_max_usd: inv.ticket >= 0 ? TICKETS[inv.ticket].max : 0,
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
            <Group label="Industry">
              {INDUSTRIES.map((x) => (
                <Chip key={x} on={f.industry === x} onClick={() => { setF((p) => ({ ...p, industry: x })); setTimeout(() => setStep(2), 220); }}>{x}</Chip>
              ))}
            </Group>
          )}
          {founder && step === 2 && (
            <>
              <Group label="Stage">
                {STAGES.map((x) => <Chip key={x} on={f.stage === x} onClick={() => setF((p) => ({ ...p, stage: x }))}>{STAGE_LABEL[x]}</Chip>)}
              </Group>
              <Group label="Traction">
                {TRACTION_RANGES.map((x) => <Chip key={x} on={f.traction_range === x} onClick={() => setF((p) => ({ ...p, traction_range: x }))}>{x}</Chip>)}
              </Group>
              <Group label="Team">
                {TEAMS.map((x) => <Chip key={x.label} on={f.team_size === x.value} onClick={() => setF((p) => ({ ...p, team_size: x.value }))}>{x.label}</Chip>)}
              </Group>
            </>
          )}
          {founder && step === 3 && (
            <>
              <Group label="Raising">
                {RAISES.map((x) => <Chip key={x.label} on={f.funding_target_usd === x.value} onClick={() => setF((p) => ({ ...p, funding_target_usd: x.value }))}>{x.label}</Chip>)}
              </Group>
              <Group label="Based in">
                {GEOGRAPHIES.map((x) => <Chip key={x} on={f.geography === x} onClick={() => setF((p) => ({ ...p, geography: x }))}>{x}</Chip>)}
              </Group>
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
            <Group label="Industries" hint="pick all that apply">
              {INDUSTRIES.map((x) => <Chip key={x} on={inv.industries.includes(x)} onClick={() => setInv((p) => ({ ...p, industries: toggle(p.industries, x) }))}>{x}</Chip>)}
            </Group>
          )}
          {!founder && step === 2 && (
            <>
              <Group label="Stages">
                {STAGES.map((x) => <Chip key={x} on={inv.stages.includes(x)} onClick={() => setInv((p) => ({ ...p, stages: toggle(p.stages, x) }))}>{STAGE_LABEL[x]}</Chip>)}
              </Group>
              <Group label="Geographies">
                {GEOGRAPHIES.map((x) => <Chip key={x} on={inv.geographies.includes(x)} onClick={() => setInv((p) => ({ ...p, geographies: toggle(p.geographies, x) }))}>{x}</Chip>)}
              </Group>
            </>
          )}
          {!founder && step === 3 && (
            <>
              <Group label="Cheque size">
                {TICKETS.map((x, i) => <Chip key={x.label} on={inv.ticket === i} onClick={() => setInv((p) => ({ ...p, ticket: i }))}>{x.label}</Chip>)}
              </Group>
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
              <button type="button" onClick={() => setStep(step - 1)} className="rounded-2xl border-2 border-ink/15 px-5 py-4 font-medium hover:border-ink">
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!current.ok || pending}
              className="flex-1 rounded-2xl bg-signal px-6 py-4 text-lg font-medium text-white shadow-lg shadow-signal/25 transition hover:bg-ink disabled:bg-ink/20 disabled:shadow-none"
            >
              {pending ? "Saving…" : step < total - 1 ? "Continue →" : founder ? "See matching investors →" : "See matching startups →"}
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
