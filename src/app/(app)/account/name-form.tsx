"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/auth-shell";
import { updateName, type NameState } from "./actions";

export function NameForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState<NameState, FormData>(updateName, {});

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">Full name</span>
        <div className="mt-2 flex gap-2">
          <input
            name="fullName"
            defaultValue={fullName}
            maxLength={80}
            required
            className="min-w-0 flex-1 rounded-xl border border-ink/20 bg-white/70 px-4 py-3 text-base outline-none transition focus:border-ink focus:bg-white focus:ring-4 focus:ring-signal/15"
          />
          <button
            disabled={pending}
            className="shrink-0 rounded-xl bg-ink px-5 py-3 font-medium text-paper transition hover:bg-signal disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </label>
      <FormAlert error={state.error} message={state.message} />
    </form>
  );
}
