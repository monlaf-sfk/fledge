"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/auth/actions";
import { Field, FormAlert } from "@/components/auth-shell";

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} placeholder="you@startup.kz" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />

      <FormAlert error={state.error ?? (linkError ? "The confirmation link is invalid or expired. Log in or sign up again." : undefined)} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-ink px-6 py-4 text-lg font-medium text-paper transition hover:bg-signal disabled:opacity-60"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-ink-soft">
        New to Fledge?{" "}
        <Link href="/signup" className="font-medium text-ink underline decoration-signal decoration-2 underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
