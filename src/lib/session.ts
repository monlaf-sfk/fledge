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
  isAdmin: boolean;
  isTest: boolean;
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

  // One round trip: profile and both possible own cards in parallel.
  const [{ data: profile }, { data: startup }, { data: investor }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, is_admin, is_test").eq("id", user.id).single(),
    supabase.from("startups").select("id").eq("owner_id", user.id).maybeSingle(),
    supabase.from("investor_profiles").select("id").eq("owner_id", user.id).maybeSingle(),
  ]);
  if (!profile) redirect("/login?error=profile");

  const role = profile.role as Role;
  const own = role === "founder" ? startup : investor;

  return {
    supabase,
    userId: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role,
    isAdmin: Boolean(profile.is_admin),
    isTest: Boolean(profile.is_test),
    ownCardId: own?.id ?? null,
  };
});

export async function requireOnboarded() {
  const session = await requireSession();
  if (!session.ownCardId) redirect("/onboarding");
  return session;
}
