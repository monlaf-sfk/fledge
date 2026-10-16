import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { PageView } from "@/components/public-track";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Fledge" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Back to the <em className="italic text-signal">feed.</em>
        </>
      }
      aside={
        <div className="max-w-sm space-y-4">
          {["Pass", "Save", "Interested"].map((a, i) => (
            <div
              key={a}
              className={`flex items-center justify-between rounded-2xl px-6 py-5 font-display text-3xl ${
                i === 2 ? "bg-signal text-white" : "border border-paper/20"
              }`}
            >
              {a}
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">0{i + 1}</span>
            </div>
          ))}
        </div>
      }
    >
      <PageView name="login_viewed" />
      <LoginForm next={next} linkError={error === "link"} />
    </AuthShell>
  );
}
