"use client";

import { startTransition, useActionState } from "react";
import { FormAlert } from "@/components/auth-shell";

type State = { error?: string };

// Submits through a transition instead of `<form action>`, so React does not reset the
// fields when the server returns a validation error.
export function ActionForm({
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  submitLabel: string;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  const [state, dispatch, pending] = useActionState<State, FormData>(action, {});

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      {children}
      <div className="sticky bottom-4 space-y-3">
        <FormAlert error={state.error} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-signal px-6 py-4 text-lg font-medium text-white shadow-lg transition hover:bg-ink disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
