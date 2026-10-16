import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard · Fledge" };

const nextSteps = {
  founder: {
    headline: "Let's get your startup in front of the right investors.",
    items: [
      ["Startup profile", "Name, one-line pitch, industry, stage, geography"],
      ["Traction & raise", "Traction range, funding target, team size"],
      ["Investor preferences", "Which investor types you are looking for"],
    ],
    cta: "Create startup profile",
  },
  investor: {
    headline: "Tell us your thesis — we'll filter the deal flow.",
    items: [
      ["Investment focus", "Industries and business models"],
      ["Stage & ticket", "Preferred stages and typical cheque size"],
      ["Geography", "Where you invest"],
    ],
    cta: "Set investment thesis",
  },
} as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role === "investor" ? "investor" : "founder";
  const copy = nextSteps[role];
  const firstName = (profile?.full_name ?? user.email ?? "").split(" ")[0];

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <Logo />
        <form action={signOut}>
          <button className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium transition hover:border-ink">
            Log out
          </button>
        </form>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-20 pt-8">
        <span className={`inline-block rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] ${role === "investor" ? "bg-moss text-paper" : "bg-signal text-white"}`}>
          {role}
        </span>
        <h1 className="mt-6 font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.95] tracking-tight">
          Hi, {firstName}. <span className="italic text-ink-soft">{copy.headline}</span>
        </h1>

        {!profile && (
          <p className="mt-6 rounded-xl border border-signal/40 bg-signal/10 px-4 py-3 text-sm">
            Profile row not found. Check that the SQL migration in <code>supabase/migrations</code> ran.
          </p>
        )}

        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
          {copy.items.map(([title, body], i) => (
            <li key={title} className="bg-paper p-7">
              <span className="font-mono text-sm text-signal">0{i + 1}</span>
              <h2 className="mt-8 font-display text-2xl">{title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>

        <button
          disabled
          title="Onboarding comes in the next sprint"
          className="mt-10 rounded-2xl bg-ink px-6 py-4 text-lg font-medium text-paper opacity-60"
        >
          {copy.cta} · soon
        </button>
      </section>
    </main>
  );
}
