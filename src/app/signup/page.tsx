import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Join Fledge" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole = role === "founder" || role === "investor" ? role : undefined;

  return (
    <AuthShell
      eyebrow="Create account"
      title={
        <>
          Find your <em className="italic text-signal">match.</em>
        </>
      }
      aside={
        <blockquote className="max-w-sm">
          <p className="font-display text-4xl leading-tight">
            “I need to know which investors are actually relevant to my startup.”
          </p>
          <footer className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-paper/50">
            Recurring founder pain · Assignment 3 interviews
          </footer>
        </blockquote>
      }
    >
      <SignupForm initialRole={initialRole} />
    </AuthShell>
  );
}
