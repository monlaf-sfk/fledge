"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

// FAQ row with an animated expand/collapse. The answer sits in a grid whose row
// goes from 0fr (closed) to 1fr (open), so it animates to its natural height
// without measuring it in JS. Multiple rows can stay open independently.
export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="py-5">
      <h3>
        <button
          type="button"
          id={`${id}-question`}
          aria-expanded={open}
          aria-controls={`${id}-answer`}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-6 text-left text-lg font-medium"
        >
          {q}
          <span
            aria-hidden
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/20 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? "rotate-45" : ""
            }`}
          >
            <Plus className="size-4" aria-hidden />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-answer`}
        role="region"
        aria-labelledby={`${id}-question`}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={`mt-3 max-w-2xl text-ink-soft transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            }`}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}
