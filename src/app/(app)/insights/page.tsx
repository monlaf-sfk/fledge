import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ColumnLabels,
  DailyColumns,
  DataTable,
  Funnel,
  GroupedPercentBars,
  Legend,
  RateColumns,
  SERIES,
  StackedShare,
  fmtPct,
  pct,
  type Column,
  type DayPoint,
} from "@/components/charts";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Insights · Fledge" };
export const dynamic = "force-dynamic";

type FunnelRow = {
  role: "all" | "founder" | "investor";
  signed_up: number;
  profile: number;
  viewed: number;
  interested: number;
  matched: number;
  connected: number;
};
type Overview = {
  generated_at: string;
  top_funnel: { visitors: number; signup_viewed: number; signups_tracked: number };
  funnel: FunnelRow[] | null;
  kpi: {
    card_actions: number;
    interested_actions: number;
    real_matches: number;
    connections: number;
    median_hours_to_match: number | null;
    active_7d: number;
    returning_users: number;
  };
  fit_buckets: { bucket: number; actions: number; interested: number }[] | null;
  action_mix: { role: string; pass: number; save: number; interested: number }[] | null;
  daily: DayPoint[] | null;
};

const EMPTY_ROW = (role: FunnelRow["role"]): FunnelRow => ({
  role, signed_up: 0, profile: 0, viewed: 0, interested: 0, matched: 0, connected: 0,
});

function Card({ title, question, children }: { title: string; question: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-line bg-white/60 p-6 sm:p-8">
      <h2 className="font-display text-3xl leading-tight">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{question}</p>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function Kpi({ label, value, detail, meaning }: { label: string; value: string; detail: string; meaning: string }) {
  return (
    <div className="flex flex-col bg-paper p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-4 font-display text-5xl leading-none">{value}</p>
      <p className="mt-2 font-mono text-xs text-ink-soft">{detail}</p>
      <p className="mt-4 text-sm leading-snug text-ink-soft">{meaning}</p>
    </div>
  );
}

export default async function InsightsPage() {
  const { supabase, isAdmin } = await requireSession();
  // Team-only page; the DB function also refuses non-admins.
  if (!isAdmin) notFound();
  const [{ data, error }, { data: onb }] = await Promise.all([
    supabase.rpc("analytics_overview"),
    supabase.rpc("onboarding_steps"),
  ]);
  const onbRows = (onb ?? []) as { role: string; step: number; users: number }[];
  const onbSteps = (role: string, labels: string[]) =>
    labels.map((label, i) => ({
      label,
      hint: `step ${i + 1}`,
      value: Number(onbRows.find((r) => r.role === role && r.step === i + 1)?.users ?? 0),
    }));

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-16">
        <p className="rounded-xl border border-signal/40 bg-signal/10 px-4 py-3 text-sm">Could not load analytics.</p>
      </main>
    );
  }

  const o = data as Overview;
  const funnel = o.funnel ?? [];
  const all = funnel.find((r) => r.role === "all") ?? EMPTY_ROW("all");
  const founder = funnel.find((r) => r.role === "founder") ?? EMPTY_ROW("founder");
  const investor = funnel.find((r) => r.role === "investor") ?? EMPTY_ROW("investor");
  const k = o.kpi;
  const t = o.top_funnel;

  const activation = [
    { label: "Signed up", hint: "created an account", value: all.signed_up },
    { label: "Completed profile", hint: "startup or thesis card", value: all.profile },
    { label: "Viewed a card", hint: "opened Discover", value: all.viewed },
    { label: "Pressed Interested", hint: "at least once", value: all.interested },
    { label: "Got a real match", hint: "mutual, demo excluded", value: all.matched },
    { label: "Connected", hint: "both sides wrote in chat", value: all.connected },
  ];
  const acquisition = [
    { label: "Visited landing", hint: "unique browsers", value: t.visitors },
    { label: "Opened sign-up", hint: "unique browsers", value: t.signup_viewed },
    { label: "Signed up", hint: "tracked sign-ups", value: t.signups_tracked },
  ];

  const roleSteps: [string, keyof FunnelRow][] = [
    ["Completed profile", "profile"],
    ["Viewed a card", "viewed"],
    ["Pressed Interested", "interested"],
    ["Got a real match", "matched"],
    ["Connected", "connected"],
  ];

  const bucketLabel = ["0–24", "25–49", "50–74", "75–100"];
  const buckets: Column[] = [0, 25, 50, 75].map((b, i) => {
    const row = (o.fit_buckets ?? []).find((x) => x.bucket === b);
    const n = row?.actions ?? 0;
    const rate = pct(row?.interested ?? 0, n);
    return {
      label: `${bucketLabel[i]}%`,
      value: rate,
      caption: `${n} ${n === 1 ? "card" : "cards"}`,
      tip: n ? `Fit ${bucketLabel[i]}%: Interested on ${row!.interested} of ${n} cards (${fmtPct(rate)})` : `Fit ${bucketLabel[i]}%: no actions yet`,
    };
  });

  const mix = o.action_mix ?? [];
  const mixRow = (role: string) => mix.find((m) => m.role === role) ?? { pass: 0, save: 0, interested: 0 };

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 pb-24 pt-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Insights · live product data</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.95] tracking-tight">
          Are we creating real connections?
        </h1>
        <p className="mt-4 max-w-3xl text-ink-soft">
          Our success metric is <b className="text-ink">qualified founder–investor connections</b>: a mutual match
          where both sides wrote in chat. Everything below explains where users get stuck on the way there. Test
          accounts are excluded; demo profiles never count as matches. Hover a bar for details.
        </p>
      </header>

      {/* KPI row */}
      <div className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="North star · connections"
          value={String(k.connections)}
          detail={`real matches in total: ${k.real_matches}`}
          meaning="Matches where founder and investor both sent a message. This is the number we want to grow."
        />
        <Kpi
          label="Profile completion"
          value={fmtPct(pct(all.profile, all.signed_up))}
          detail={`${all.profile} of ${all.signed_up} sign-ups`}
          meaning="Share of new users who finish their card. Low = onboarding form is too long or unclear."
        />
        <Kpi
          label="Interest rate"
          value={fmtPct(pct(k.interested_actions, k.card_actions))}
          detail={`${k.interested_actions} of ${k.card_actions} card actions`}
          meaning="How often a card gets Interested. Low = the feed shows irrelevant profiles."
        />
        <Kpi
          label="Interested → match"
          value={fmtPct(pct(all.matched, all.interested))}
          detail={`${all.matched} of ${all.interested} users who pressed Interested`}
          meaning="Users whose interest was returned. Low = one side is not active enough (liquidity)."
        />
        <Kpi
          label="Time to first match"
          value={k.median_hours_to_match === null ? "—" : `${k.median_hours_to_match} h`}
          detail="median, from sign-up"
          meaning="How long a new user waits for the first mutual match."
        />
        <Kpi
          label="Active users, 7 days"
          value={String(k.active_7d)}
          detail={`${k.returning_users} came back on 2+ days`}
          meaning="Signed-in users with any action this week; returning users show early retention."
        />
        <Kpi
          label="Landing → sign-up"
          value={fmtPct(pct(t.signups_tracked, t.visitors))}
          detail={`${t.signups_tracked} of ${t.visitors} visitors`}
          meaning="Share of landing visitors who create an account. Tracking started 16 Oct 2026."
        />
        <Kpi
          label="Match to connection"
          value={fmtPct(pct(k.connections, k.real_matches))}
          detail={`${k.connections} of ${k.real_matches} real matches`}
          meaning="Do matches turn into a conversation? Low = matches are not valuable enough."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <Card
          title="Activation funnel"
          question="From account to connection: at which step do we lose the most people?"
        >
          <Funnel steps={activation} />
          <DataTable
            head={["Step", "People", "From previous", "From first"]}
            rows={activation.map((s, i) => [
              s.label,
              s.value,
              i ? fmtPct(pct(s.value, activation[i - 1].value)) : "—",
              fmtPct(pct(s.value, activation[0].value)),
            ])}
          />
        </Card>

        <Card title="Acquisition" question="Does the landing page convince visitors to sign up?">
          <Funnel steps={acquisition} />
          <p className="mt-5 text-sm text-ink-soft">
            Counted by anonymous browser id, so one person on two devices counts twice.
          </p>
          <DataTable
            head={["Step", "Browsers", "From previous"]}
            rows={acquisition.map((s, i) => [s.label, s.value, i ? fmtPct(pct(s.value, acquisition[i - 1].value)) : "—"])}
          />
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="Onboarding wizard · founders" question="Which of the 4 questions makes founders quit? Users who reached each step.">
          <Funnel steps={onbSteps("founder", ["Name & pitch", "Industry", "Stage, traction, team", "Raise & geography"])} />
        </Card>
        <Card title="Onboarding wizard · investors" question="Same for investors.">
          <Funnel steps={onbSteps("investor", ["Name & type", "Industries", "Stages & geography", "Cheque size"])} />
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card
          title="Founders vs investors"
          question="Which side of the marketplace gets stuck? Bars show % of each side's sign-ups that reached the step."
        >
          <Legend
            items={[
              { label: `Founders (${founder.signed_up} signed up)`, color: SERIES.founder },
              { label: `Investors (${investor.signed_up} signed up)`, color: SERIES.investor },
            ]}
          />
          <div className="mt-5">
            <GroupedPercentBars
              rows={roleSteps.map(([label, key]) => ({
                label,
                values: [
                  { key: "Founders", color: SERIES.founder, value: pct(founder[key] as number, founder.signed_up), note: `${founder[key]} of ${founder.signed_up} founders` },
                  { key: "Investors", color: SERIES.investor, value: pct(investor[key] as number, investor.signed_up), note: `${investor[key]} of ${investor.signed_up} investors` },
                ],
              }))}
            />
          </div>
          <DataTable
            head={["Step", "Founders", "Investors"]}
            rows={roleSteps.map(([label, key]) => [label, `${founder[key]} / ${founder.signed_up}`, `${investor[key]} / ${investor.signed_up}`])}
          />
        </Card>

        <Card
          title="Does the fit score work?"
          question="Hypothesis: cards with a higher fit score get Interested more often. If true, columns rise left to right."
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Interested rate by fit score</p>
          <RateColumns columns={buckets} color={SERIES.interested} />
          <ColumnLabels columns={buckets} />
          <DataTable
            head={["Fit score", "Cards acted on", "Interested rate"]}
            rows={buckets.map((b) => [b.label, b.caption, fmtPct(b.value)])}
          />
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="What users do with a card" question="Share of Pass, Save and Interested per side. Many Pass = weak relevance.">
          <Legend
            items={[
              { label: "Pass", color: SERIES.pass },
              { label: "Save", color: SERIES.save },
              { label: "Interested", color: SERIES.interested },
            ]}
          />
          <div className="mt-5">
            <StackedShare
              rows={(["founder", "investor"] as const).map((role) => {
                const m = mixRow(role);
                return {
                  label: role === "founder" ? "Founders" : "Investors",
                  segments: [
                    { key: "Pass", color: SERIES.pass, value: m.pass },
                    { key: "Save", color: SERIES.save, value: m.save },
                    { key: "Interested", color: SERIES.interested, value: m.interested },
                  ],
                };
              })}
            />
          </div>
          <DataTable
            head={["Side", "Pass", "Save", "Interested"]}
            rows={(["founder", "investor"] as const).map((r) => {
              const m = mixRow(r);
              return [r, m.pass, m.save, m.interested];
            })}
          />
        </Card>

        <Card title="Activity, last 14 days" question="Active people per day (signed-in users and landing visitors).">
          <DailyColumns days={o.daily ?? []} />
          <DataTable
            head={["Day", "Active", "Sign-ups", "Real matches"]}
            rows={(o.daily ?? []).map((d) => [d.day, d.active, d.signups, d.matches])}
          />
        </Card>
      </div>

      <p className="text-xs text-ink-soft">
        Updated {new Date(o.generated_at).toLocaleString("en-GB")}. Source: Supabase tables events, swipes, matches,
        messages via <code>analytics_overview()</code>. Aggregates only — no personal data is shown.
      </p>
    </main>
  );
}
