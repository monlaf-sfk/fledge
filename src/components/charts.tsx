// Small, dependency-free chart primitives for the Insights page (server-rendered).
// Hover tooltips are CSS-only: each mark's hit area is the full row/column.

export const SERIES = {
  founder: "#e8541c",
  investor: "#1f8a62",
  pass: "#9b9a92",
  save: "#2a78d6",
  interested: "#e8541c",
  ink: "#14261f",
} as const;

export const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : null);
export const fmtPct = (v: number | null) => (v === null ? "—" : `${v}%`);

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs leading-relaxed text-paper shadow-lg group-hover:block group-focus-within:block"
    >
      {children}
    </span>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export type FunnelStep = { label: string; hint: string; value: number };

// Horizontal funnel: bar length = share of the first step; right column = step conversion.
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(1, steps[0]?.value ?? 0);
  // Biggest drop between consecutive steps (only where the previous step has people).
  let leak = -1;
  let leakLoss = -1;
  steps.forEach((s, i) => {
    if (i === 0 || steps[i - 1].value === 0) return;
    const loss = 1 - s.value / steps[i - 1].value;
    if (loss > leakLoss) {
      leakLoss = loss;
      leak = i;
    }
  });

  return (
    <div>
      <p className="mb-4 text-xs text-ink-soft">
        Bar length = share of the first step. Right column = conversion from the previous step.
      </p>
      <div className="mb-2 grid grid-cols-[minmax(120px,190px)_1fr_64px] gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        <span>Step</span>
        <span>People</span>
        <span className="text-right">Conv.</span>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => {
          const fromPrev = i === 0 ? null : pct(s.value, steps[i - 1].value);
          const fromTop = pct(s.value, steps[0].value);
          const isLeak = i === leak && leakLoss > 0;
          return (
            <li
              key={s.label}
              tabIndex={0}
              className="group relative grid grid-cols-[minmax(120px,190px)_1fr_64px] items-center gap-4 rounded-lg py-1 outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            >
              <span className="text-sm font-medium leading-tight">
                {s.label}
                <span className="block text-xs font-normal text-ink-soft">{s.hint}</span>
              </span>
              <span className="relative h-9 rounded-md bg-paper-deep/70">
                <span
                  className="absolute inset-y-0 left-0 rounded-r-[4px]"
                  style={{ width: `${s.value === 0 ? 0 : Math.max(1.5, (s.value / top) * 100)}%`, background: SERIES.ink }}
                />
                <span className="absolute inset-y-0 left-3 flex items-center font-mono text-sm text-white mix-blend-difference">
                  {s.value}
                </span>
                <Tip>
                  <b>{s.label}</b>: {s.value} people
                  <br />
                  {fromPrev === null ? "First step" : `${fmtPct(fromPrev)} of previous step`} · {fmtPct(fromTop)} of first step
                </Tip>
              </span>
              <span className={`text-right font-mono text-sm ${isLeak ? "font-semibold text-signal" : "text-ink-soft"}`}>
                {i === 0 ? "" : fmtPct(fromPrev)}
                {isLeak && <span className="block text-[10px] uppercase tracking-wider">biggest drop</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export type GroupedRow = { label: string; values: { key: string; color: string; value: number | null; note: string }[] };

// Grouped horizontal bars on a 0–100% scale, one bar per series per row, values labelled.
export function GroupedPercentBars({ rows }: { rows: GroupedRow[] }) {
  return (
    <ol className="space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <p className="mb-1.5 text-sm font-medium">{r.label}</p>
          <div className="space-y-[2px]">
            {r.values.map((v) => (
              <div key={v.key} tabIndex={0} className="group relative flex items-center gap-3 outline-none">
                <span className="relative h-5 flex-1 rounded-sm bg-paper-deep/60">
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-[4px]"
                    style={{ width: `${v.value ?? 0}%`, background: v.color }}
                  />
                </span>
                <span className="w-24 shrink-0 font-mono text-xs text-ink-soft">
                  {v.key} {fmtPct(v.value)}
                </span>
                <Tip>
                  <b>{v.key}</b> · {r.label}: {fmtPct(v.value)}
                  <br />
                  {v.note}
                </Tip>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

export type Column = { label: string; value: number | null; caption: string; tip: string };

// Vertical columns on a 0–100% scale (rates), value labelled on top.
export function RateColumns({ columns, color }: { columns: Column[]; color: string }) {
  return (
    <div className="flex h-56 items-end gap-3 border-b border-ink/20 pt-6">
      {columns.map((c) => (
        <div key={c.label} tabIndex={0} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none">
          <span className="mb-1 font-mono text-sm">{fmtPct(c.value)}</span>
          <span
            className="w-full max-w-[72px] rounded-t-[4px]"
            style={{ height: `${c.value ?? 0}%`, minHeight: c.value ? 3 : 0, background: color }}
          />
          <Tip>{c.tip}</Tip>
        </div>
      ))}
    </div>
  );
}

export function ColumnLabels({ columns }: { columns: Column[] }) {
  return (
    <div className="mt-2 flex gap-3">
      {columns.map((c) => (
        <div key={c.label} className="flex-1 text-center">
          <p className="text-sm font-medium">{c.label}</p>
          <p className="text-xs text-ink-soft">{c.caption}</p>
        </div>
      ))}
    </div>
  );
}

export type StackSeg = { key: string; color: string; value: number };

// 100% stacked bar per row with a 2px surface gap between segments.
export function StackedShare({ rows }: { rows: { label: string; segments: StackSeg[] }[] }) {
  return (
    <ol className="space-y-4">
      {rows.map((r) => {
        const total = r.segments.reduce((a, s) => a + s.value, 0);
        return (
          <li key={r.label}>
            <p className="mb-1.5 flex justify-between text-sm">
              <span className="font-medium">{r.label}</span>
              <span className="font-mono text-xs text-ink-soft">{total} {total === 1 ? "action" : "actions"}</span>
            </p>
            <div className="flex h-9 gap-[2px] overflow-hidden rounded-md bg-paper-deep/60">
              {total > 0 &&
                r.segments
                  .filter((s) => s.value > 0)
                  .map((s) => {
                    const share = pct(s.value, total)!;
                    return (
                      <span
                        key={s.key}
                        tabIndex={0}
                        className="group relative flex items-center justify-center outline-none first:rounded-l-[4px] last:rounded-r-[4px]"
                        style={{ width: `${share}%`, background: s.color }}
                      >
                        {share >= 12 && <span className="font-mono text-xs text-white">{share}%</span>}
                        <Tip>
                          <b>{s.key}</b>: {s.value} of {total} ({share}%)
                        </Tip>
                      </span>
                    );
                  })}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export type DayPoint = { day: string; active: number; signups: number; matches: number };

// Daily active people as columns; signups and matches in the tooltip.
export function DailyColumns({ days }: { days: DayPoint[] }) {
  const max = Math.max(1, ...days.map((d) => d.active));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 border-b border-ink/20">
        {days.map((d) => (
          <div key={d.day} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
            <span
              className="w-full rounded-t-[4px]"
              style={{ height: `${(d.active / max) * 100}%`, minHeight: d.active ? 3 : 0, background: SERIES.ink }}
            />
            <Tip>
              <b>{new Date(d.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</b>
              <br />
              {d.active} active · {d.signups} sign-ups · {d.matches} real matches
            </Tip>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-ink-soft">
        <span>{days[0] && new Date(days[0].day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        <span>today</span>
      </div>
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-5 text-sm">
      <summary className="cursor-pointer text-ink-soft hover:text-ink">Show as table</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} className="border-b border-line py-2 pr-4 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="border-b border-line/60 py-2 pr-4 font-mono">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
