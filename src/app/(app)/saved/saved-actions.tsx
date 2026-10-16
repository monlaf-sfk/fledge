"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { swipe } from "../discover/actions";

export function SavedActions({ targetId, score }: { targetId: string; score: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (action: "pass" | "interested") =>
    startTransition(async () => {
      const res = await swipe(targetId, action, score);
      if (res.error) return setError(res.error);
      if (res.matchId) return setMatchId(res.matchId);
      router.refresh();
    });

  if (matchId) {
    return (
      <Link href={`/matches/${matchId}`} className="block rounded-2xl bg-signal px-5 py-3 text-center font-medium text-white">
        It&apos;s a match — open chat →
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={pending}
          onClick={() => run("pass")}
          className="rounded-2xl border border-ink/15 bg-white px-4 py-3 font-medium transition hover:bg-paper-deep disabled:opacity-60"
        >
          ✕ Pass
        </button>
        <button
          disabled={pending}
          onClick={() => run("interested")}
          className="rounded-2xl bg-signal px-4 py-3 font-medium text-white transition hover:bg-ink disabled:opacity-60"
        >
          ♥ Interested
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-[#a8320a]">{error}</p>}
    </div>
  );
}
