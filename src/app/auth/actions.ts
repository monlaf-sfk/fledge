"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-redirect";
import { track } from "@/lib/track";

export type Role = "founder" | "investor";

export type AuthState = {
  error?: string;
  message?: string;
  fields?: { email?: string; fullName?: string; role?: Role };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRole(value: unknown): value is Role {
  return value === "founder" || value === "investor";
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = formData.get("role");
  const fields = { email, fullName, role: isRole(role) ? role : undefined };

  if (!isRole(role)) return { error: "Choose whether you join as a founder or an investor.", fields };
  if (fullName.length < 2) return { error: "Enter your full name.", fields };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields };
  if (password.length < 8) return { error: "Password must have at least 8 characters.", fields };

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: error.message, fields };

  // Email confirmation on: no session yet, user must click the link.
  if (!data.session) {
    return { message: `Check ${email} — we sent a confirmation link.`, fields };
  }

  const anon = String(formData.get("anon_id") ?? "");
  if (data.user) {
    await track(supabase, data.user.id, "signup_completed", {
      role,
      ...(/^[a-zA-Z0-9-]{8,64}$/.test(anon) ? { anon_id: anon } : {}),
    });
  }
  redirect("/onboarding");
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!EMAIL_RE.test(email) || !password) {
    return { error: "Enter your email and password.", fields: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // One generic message: do not reveal whether the email is registered.
  if (error) return { error: "Wrong email or password.", fields: { email } };

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
