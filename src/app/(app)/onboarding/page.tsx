import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { ChipGroup, Section, Select, TextArea, TextField, opts } from "@/components/form-controls";
import {
  GEOGRAPHIES,
  INDUSTRIES,
  INVESTOR_COLUMNS,
  INVESTOR_TYPES,
  INVESTOR_TYPE_LABEL,
  STAGES,
  STAGE_LABEL,
  STARTUP_COLUMNS,
  TRACTION_RANGES,
  type InvestorCard,
  type StartupCard,
} from "@/lib/catalog";
import { requireSession } from "@/lib/session";
import { saveFounder, saveInvestor } from "./actions";

export const metadata: Metadata = { title: "Your profile · Fledge" };

export default async function OnboardingPage() {
  const { supabase, role, ownCardId, email } = await requireSession();
  const editing = Boolean(ownCardId);

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
        {editing ? "Edit profile" : "Step 1 of 2 · Profile"}
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] tracking-tight">
        {role === "founder" ? (
          <>
            Your startup, <em className="italic text-signal">structured.</em>
          </>
        ) : (
          <>
            Your thesis, <em className="italic text-signal">in filters.</em>
          </>
        )}
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        {role === "founder"
          ? "Investors see the card section before a match. Your identity, deck and detailed metrics stay hidden until interest is mutual."
          : "We rank startups by industry, stage, geography and ticket fit. Contacts are shared with founders only after a match."}
      </p>
      <div className="mt-10">
        {role === "founder" ? (
          <FounderForm supabase={supabase} ownCardId={ownCardId} email={email} />
        ) : (
          <InvestorForm supabase={supabase} ownCardId={ownCardId} email={email} />
        )}
      </div>
    </main>
  );
}

type FormProps = {
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"];
  ownCardId: string | null;
  email: string;
};

async function FounderForm({ supabase, ownCardId, email }: FormProps) {
  let s: Partial<StartupCard> = {};
  let p: Record<string, string> = {};
  if (ownCardId) {
    const [{ data: card }, { data: priv }] = await Promise.all([
      supabase.from("startups").select(STARTUP_COLUMNS).eq("id", ownCardId).single(),
      supabase.from("startup_private").select("*").eq("startup_id", ownCardId).maybeSingle(),
    ]);
    s = (card as StartupCard | null) ?? {};
    p = (priv as Record<string, string> | null) ?? {};
  }

  return (
    <ActionForm
      action={saveFounder}
      submitLabel={ownCardId ? "Save changes" : "Save and start discovering →"}
      pendingLabel="Saving…"
    >
      <Section title="Startup card" note="Visible to investors in the Discover feed.">
        <TextField label="Startup name" name="name" defaultValue={s.name} required maxLength={80} />
        <TextField
          label="One-line pitch"
          name="pitch"
          defaultValue={s.pitch}
          required
          maxLength={140}
          hint="10–140 characters. Example: Automated bookkeeping for SMBs in Kazakhstan."
        />
        <TextArea label="Problem & solution" name="problem" defaultValue={s.problem} maxLength={600} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Industry" name="industry" defaultValue={s.industry ?? ""} options={opts(INDUSTRIES)} required />
          <Select label="Stage" name="stage" defaultValue={s.stage ?? ""} options={opts(STAGES, STAGE_LABEL)} required />
          <Select label="Geography" name="geography" defaultValue={s.geography ?? ""} options={opts(GEOGRAPHIES)} required />
          <Select label="Traction" name="traction_range" defaultValue={s.traction_range ?? ""} options={opts(TRACTION_RANGES)} required />
          <TextField label="Funding target, USD" name="funding_target_usd" inputMode="numeric" defaultValue={s.funding_target_usd} placeholder="300000" required />
          <TextField label="Team size" name="team_size" type="number" min={1} max={500} defaultValue={s.team_size} placeholder="5" required />
        </div>
        <ChipGroup
          label="Looking for"
          name="looking_for"
          options={opts(INVESTOR_TYPES, INVESTOR_TYPE_LABEL)}
          defaultValues={s.looking_for}
        />
      </Section>

      <Section title="Unlocked after a match" note="Only matched investors can see this.">
        <TextArea label="About you" name="founder_bio" defaultValue={p.founder_bio} maxLength={600} placeholder="Background, previous experience" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="LinkedIn" name="linkedin_url" defaultValue={p.linkedin_url} placeholder="linkedin.com/in/…" />
          <TextField label="Contact email" name="contact_email" type="email" defaultValue={p.contact_email ?? email} />
        </div>
        <TextField label="Pitch deck link" name="deck_url" defaultValue={p.deck_url} placeholder="docsend.com/… or Google Drive" />
        <TextArea label="Detailed metrics" name="detailed_metrics" defaultValue={p.detailed_metrics} maxLength={600} placeholder="MRR, growth, retention, CAC…" />
      </Section>
    </ActionForm>
  );
}

async function InvestorForm({ supabase, ownCardId, email }: FormProps) {
  let i: Partial<InvestorCard> = {};
  let p: Record<string, string> = {};
  if (ownCardId) {
    const [{ data: card }, { data: priv }] = await Promise.all([
      supabase.from("investor_profiles").select(INVESTOR_COLUMNS).eq("id", ownCardId).single(),
      supabase.from("investor_private").select("*").eq("investor_id", ownCardId).maybeSingle(),
    ]);
    i = (card as InvestorCard | null) ?? {};
    p = (priv as Record<string, string> | null) ?? {};
  }

  return (
    <ActionForm
      action={saveInvestor}
      submitLabel={ownCardId ? "Save changes" : "Save and start discovering →"}
      pendingLabel="Saving…"
    >
      <Section title="Investor card" note="Visible to founders in the Discover feed.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Name or fund" name="display_name" defaultValue={i.display_name} required maxLength={80} />
          <Select
            label="Investor type"
            name="investor_type"
            defaultValue={i.investor_type ?? ""}
            options={opts(INVESTOR_TYPES, INVESTOR_TYPE_LABEL)}
            required
          />
        </div>
        <TextArea label="Investment thesis" name="thesis" defaultValue={i.thesis} required maxLength={600} placeholder="What you invest in and why" />
        <ChipGroup label="Industries" name="industries" options={opts(INDUSTRIES)} defaultValues={i.industries} />
        <ChipGroup label="Stages" name="stages" options={opts(STAGES, STAGE_LABEL)} defaultValues={i.stages} />
        <ChipGroup label="Geographies" name="geographies" options={opts(GEOGRAPHIES)} defaultValues={i.geographies} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Min ticket, USD" name="ticket_min_usd" inputMode="numeric" defaultValue={i.ticket_min_usd} placeholder="25000" required />
          <TextField label="Max ticket, USD" name="ticket_max_usd" inputMode="numeric" defaultValue={i.ticket_max_usd} placeholder="100000" required />
        </div>
        <TextField label="Selected portfolio" name="portfolio" defaultValue={i.portfolio} maxLength={400} placeholder="Optional" />
      </Section>

      <Section title="Unlocked after a match" note="Only matched founders can see this.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Contact email" name="contact_email" type="email" defaultValue={p.contact_email ?? email} />
          <TextField label="LinkedIn" name="linkedin_url" defaultValue={p.linkedin_url} placeholder="linkedin.com/in/…" />
        </div>
        <TextField label="Website" name="website_url" defaultValue={p.website_url} placeholder="Optional" />
      </Section>
    </ActionForm>
  );
}
