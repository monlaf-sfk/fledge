import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { requireSession } from "@/lib/session";
import { NameForm } from "./name-form";

export const metadata: Metadata = { title: "Account · Fledge" };

// Personal Account (A9-01..03): personal info, edit profile, activity statistics.
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const { supabase, userId, email, fullName, role, ownCardId, isAdmin } = await requireSession();
  if (!ownCardId && !isAdmin) redirect("/onboarding");
  const founder = role === "founder";
  const other = founder ? "investors" : "startups";

  const [{ data: swipes }, { count: matchCount }] = await Promise.all([
    supabase.from("swipes").select("action").eq("actor_id", userId),
    supabase.from("matches").select("id", { count: "exact", head: true }),
  ]);
  const count = (a: string) => (swipes ?? []).filter((s) => s.action === a).length;

  const stats = [
    { label: "Right swipes", value: count("interested"), note: `Interested — ${other} you want to meet`, href: "/discover" },
    { label: "Left swipes", value: count("pass"), note: `Passed — ${other} you skipped`, href: "/discover" },
    { label: "Saved", value: count("save"), note: "Kept for later — open the list", href: "/saved" },
    { label: "Matches", value: matchCount ?? 0, note: "Both sides interested — chat is open", href: "/matches" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Personal account</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.95] tracking-tight">
        Hi, {fullName.split(" ")[0]}.
      </h1>
      {saved === "1" && (
        <p role="status" className="mt-6 inline-block rounded-xl border border-moss/30 bg-moss/10 px-4 py-3 text-sm text-moss">
          Profile saved. Your card is updated in the feed.
        </p>
      )}

      <section id="statistics" className="mt-10">
        <h2 className="font-display text-2xl">Your activity</h2>
        <p className="mt-1 text-sm text-ink-soft">How you have used Fledge so far. Click a number to open the list.</p>
        <div className="mt-5 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="group bg-paper p-6 transition hover:bg-white">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{s.label}</p>
              <p className="mt-4 font-display text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-ink-soft transition group-hover:text-signal">{s.note} →</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-2xl">Personal information</h2>
          <div className="mt-6 space-y-5">
            <NameForm fullName={fullName} />
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">Email</dt>
              <dd className="break-all">{email}</dd>
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">Role</dt>
              <dd className="capitalize">{role}</dd>
            </dl>
          </div>
        </section>

        <section className="flex flex-col rounded-3xl border border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-2xl">{founder ? "Startup profile" : "Investor profile"}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {founder
              ? "Industry, stage, raise, team size, deck and contacts that investors see."
              : "Thesis, industries, stages, geographies, ticket and contacts that founders see."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-2xl bg-signal px-5 py-3 font-medium text-white transition hover:bg-ink">
              Edit profile
            </Link>
            <Link href="/discover" className="rounded-2xl border-2 border-ink px-5 py-2.5 font-medium transition hover:border-signal hover:text-signal">
              Continue discovering
            </Link>
          </div>
          <form action={signOut} className="mt-auto pt-8">
            <button className="text-sm font-medium text-ink-soft underline decoration-ink/30 underline-offset-4 transition hover:text-signal">
              Log out
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
