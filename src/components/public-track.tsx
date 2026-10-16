"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackPublic, type PublicEvent } from "@/app/track-actions";

const KEY = "fledge_anon_id";
let memoryId: string | null = null;

// Anonymous browser id for visitor counts. Storage can be blocked; fall back to memory.
export function anonId() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    memoryId ??= crypto.randomUUID();
    return memoryId;
  }
}

export function PageView({ name, props }: { name: PublicEvent; props?: Record<string, string> }) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    void trackPublic(name, anonId(), JSON.parse(key));
  }, [name, key]);
  return null;
}

export function TrackedLink({
  cta,
  ...props
}: React.ComponentProps<typeof Link> & { cta: string }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        void trackPublic("cta_clicked", anonId(), { cta });
        props.onClick?.(e);
      }}
    />
  );
}
