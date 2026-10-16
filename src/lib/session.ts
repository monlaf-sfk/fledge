import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/app/auth/actions";

export type Session = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  // id of the user's own startup (founder) or investor profile (investor); null until onboarding
  ownCardId: string | null;
};

// Signed-in user with profile and own card. Redirects to /login when signed out.
export const requireSession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login?error=profile");

  const role = profile.role as Role;
  const table = role === "founder" ? "startups" : "investor_profiles";
  const { data: own } = await supabase.from(table).select("id").eq("owner_id", user.id).maybeSingle();

  return {
    supabase,
    userId: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role,
    ownCardId: own?.id ?? null,
  };
});

export async function requireOnboarded() {
  const session = await requireSession();
  if (!session.ownCardId) redirect("/onboarding");
  return session;
}
