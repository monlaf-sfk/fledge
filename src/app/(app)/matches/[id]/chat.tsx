"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessage } from "./actions";

export type ChatMessage = { id: string; body: string; mine: boolean; created_at: string };

const POLL_MS = 5000;

export function Chat({ matchId, messages, otherName, demo }: {
  matchId: string;
  messages: ChatMessage[];
  otherName: string;
  demo: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  // Simple polling for new messages; enough for the MVP.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || pending) return;
    const body = text;
    startTransition(async () => {
      const res = await sendMessage(matchId, body);
      if (res.error) setError(res.error);
      else {
        setText("");
        setError(null);
      }
    });
  };

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-3xl border border-line bg-white/70">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-soft">
            Say hi to {otherName}. A short intro and a proposed call time work best.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] ${
                m.mine ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md bg-paper-deep"
              }`}
            >
              {m.body}
              <span className="mt-1 block text-right font-mono text-[10px] opacity-50">
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {demo && (
        <p className="border-t border-line bg-paper px-5 py-2 text-xs text-ink-soft">
          Demo profile — messages are saved, but nobody will reply.
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Write a message…"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none focus:border-ink"
        />
        <button
          disabled={pending || !text.trim()}
          className="rounded-xl bg-signal px-5 py-3 font-medium text-white transition hover:bg-ink disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {error && <p role="alert" className="px-5 pb-3 text-sm text-[#a8320a]">{error}</p>}
    </div>
  );
}
