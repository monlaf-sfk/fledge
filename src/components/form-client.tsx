"use client";

import { useState } from "react";

// Client-side form fields for the profile edit form (registration formatting fix, A8-T4/T5).
const labelCls = "font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft";
const inputCls =
  "mt-2 w-full rounded-xl border border-ink/20 bg-white/70 px-4 py-3 text-base outline-none transition placeholder:text-ink/30 focus:border-ink focus:bg-white focus:ring-4 focus:ring-signal/15";

// A select with an "Other" option; the text field appears only when Other is chosen.
export function SelectWithOther({
  label,
  name,
  otherName,
  otherValue,
  options,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  otherName: string;
  otherValue: string;
  options: readonly { value: string; label: string }[];
  defaultValue: string;
  placeholder: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <label className="block">
        <span className={labelCls}>{label}</span>
        <select
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          className={`${inputCls} appearance-none`}
        >
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
      {value === "Other" && (
        <input
          name={otherName}
          aria-label={`${label}: your own`}
          defaultValue={otherValue}
          maxLength={40}
          required
          autoFocus={!otherValue}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </div>
  );
}

// USD amount shown with thousands separators; the server strips commas.
export function MoneyField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: number;
  placeholder?: string;
}) {
  const fmt = (n: number | undefined) => (n ? n.toLocaleString("en-US") : "");
  const [value, setValue] = useState(fmt(defaultValue));
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-ink-soft">$</span>
        <input
          name={name}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          required
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
            setValue(digits ? Number(digits).toLocaleString("en-US") : "");
          }}
          className={`${inputCls} pl-8`}
        />
      </span>
    </label>
  );
}
