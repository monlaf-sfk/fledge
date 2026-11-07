"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/auth-shell";
import { deleteAccount, type DeleteAccountState } from "./actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, {});

  return (
    <form action={action} className="mt-5 space-y-3">
      <label className="block">
        <span className="text-sm text-ink-soft">
          Type <strong className="font-mono text-ink">DELETE</strong> to confirm.
        </span>
        <input
          name="confirmation"
          required
          autoComplete="off"
          spellCheck={false}
          className="mt-2 w-full rounded-xl border border-signal/30 bg-white/70 px-4 py-3 text-base uppercase outline-none transition focus:border-signal focus:bg-white focus:ring-4 focus:ring-signal/15"
        />
      </label>
      <FormAlert error={state.error} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl border-2 border-signal px-5 py-2.5 font-medium text-signal transition hover:bg-signal hover:text-white disabled:opacity-60"
      >
        {pending ? "Deleting account…" : "Delete account"}
      </button>
    </form>
  );
}
