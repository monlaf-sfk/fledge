"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type AuthState, type Role } from "@/app/auth/actions";
import { Field, FormAlert } from "@/components/auth-shell";

const roles: { value: Role; title: string; hint: string }[] = [
  { value: "founder", title: "Founder", hint: "I'm raising for my startup" },
  { value: "investor", title: "Investor", hint: "I'm looking for startups" },
];

export function SignupForm({ initialRole }: { initialRole?: Role }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  const [role, setRole] = useState<Role | undefined>(state.fields?.role ?? initialRole);

  if (state.message) {
    return (
      <div className="space-y-6">
        <FormAlert message={state.message} />
        <Link href="/login" className="inline-block font-medium underline decoration-signal decoration-2 underline-offset-4">
          Go to log in →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">I join as</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {roles.map((r) => {
            const active = role === r.value;
            return (
              <label
                key={r.value}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                  active ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white/60 hover:border-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={active}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between">
                  <span className="font-display text-2xl">{r.title}</span>
                  <span className={`h-3 w-3 rounded-full ${active ? "bg-signal" : "border border-ink/30"}`} />
                </span>
                <span className={`mt-1 block text-xs ${active ? "text-paper/70" : "text-ink-soft"}`}>{r.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field label="Full name" name="fullName" autoComplete="name" required defaultValue={state.fields?.fullName} placeholder="Your full name" />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} placeholder="you@startup.kz" />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />

      <FormAlert error={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-signal px-6 py-4 text-lg font-medium text-white transition hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Creating account…" : role === "investor" ? "Create investor account" : role === "founder" ? "Create founder account" : "Create account"}
      </button>

      <p className="text-center text-sm text-ink-soft">
        Already on Fledge?{" "}
        <Link href="/login" className="font-medium text-ink underline decoration-signal decoration-2 underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
