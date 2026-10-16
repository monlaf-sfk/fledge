// Form primitives for onboarding. Server-renderable; no client state.

const labelCls = "font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft";
const inputCls =
  "mt-2 w-full rounded-xl border border-ink/20 bg-white/70 px-4 py-3 text-base outline-none transition placeholder:text-ink/30 focus:border-ink focus:bg-white focus:ring-4 focus:ring-signal/15";

export function TextField({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input {...props} className={inputCls} />
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <textarea rows={3} {...props} className={`${inputCls} resize-y`} />
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <select {...props} className={`${inputCls} appearance-none`}>
        <option value="" disabled>
          Choose…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ChipGroup({
  label,
  name,
  options,
  defaultValues = [],
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValues?: readonly string[];
}) {
  return (
    <fieldset>
      <legend className={labelCls}>{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={defaultValues.includes(o.value)}
              className="peer sr-only"
            />
            <span className="inline-block rounded-full border border-ink/20 bg-white/60 px-3.5 py-2 text-sm transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-4 peer-focus-visible:ring-signal/30 hover:border-ink/50">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
      <h2 className="font-display text-2xl">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export const opts = (list: readonly string[], labels?: Record<string, string>) =>
  list.map((v) => ({ value: v, label: labels?.[v] ?? v }));
