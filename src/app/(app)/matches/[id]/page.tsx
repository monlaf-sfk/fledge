import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvestorCardView, StartupCardView } from "@/components/cards";
import { loadMatch } from "@/lib/matches";
import { requireOnboarded } from "@/lib/session";
import { Chat, type ChatMessage } from "./chat";

export const metadata: Metadata = { title: "Match · Fledge" };

function Detail({ label, value, href }: { label: string; value?: string; href?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="mt-0.5 break-words">
        {href ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="underline decoration-signal decoration-2 underline-offset-4">
            {value.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireOnboarded();
  const match = await loadMatch(session, id);
  if (!match) notFound();

  const founder = session.role === "founder";
  const { data: rows } = await session.supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("match_id", id)
    .order("created_at", { ascending: true })
    .limit(500);
  const messages: ChatMessage[] = (rows ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    mine: m.sender_id === session.userId,
  }));

  const otherName = founder ? match.investor.display_name : match.startup.private?.founder_name ?? match.startup.name;
  const demo = founder ? match.investor.is_demo : match.startup.is_demo;
  const sp = match.startup.private;
  const ip = match.investor.private;

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 pb-24 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="space-y-5">
        <Link href="/matches" className="text-sm text-ink-soft hover:text-ink">← All matches</Link>
        {founder ? (
          <InvestorCardView i={match.investor} locked={false} />
        ) : (
          <StartupCardView s={match.startup} locked={false} />
        )}
        <div className="rounded-3xl border-2 border-signal/40 bg-signal/5 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">Unlocked by the match</p>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {founder ? (
              <>
                <Detail label="Contact email" value={ip?.contact_email} />
                <Detail label="LinkedIn" value={ip?.linkedin_url} href />
                <Detail label="Website" value={ip?.website_url} href />
              </>
            ) : (
              <>
                <Detail label="Founder" value={sp?.founder_name} />
                <Detail label="Contact email" value={sp?.contact_email} />
                <Detail label="LinkedIn" value={sp?.linkedin_url} href />
                <Detail label="Pitch deck" value={sp?.deck_url} href />
                <Detail label="About the founder" value={sp?.founder_bio} />
                <Detail label="Detailed metrics" value={sp?.detailed_metrics} />
              </>
            )}
          </dl>
        </div>
      </section>
      <section className="lg:sticky lg:top-28 lg:self-start">
        <h1 className="mb-4 font-display text-3xl">Chat with {otherName}</h1>
        <Chat matchId={match.id} messages={messages} otherName={otherName} demo={demo} />
      </section>
    </main>
  );
}
