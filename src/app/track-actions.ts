"use server";

import { createClient } from "@/lib/supabase/server";

export type PublicEvent = "landing_viewed" | "signup_viewed" | "login_viewed" | "cta_clicked";

// Top-of-funnel events from public pages. The DB function whitelists names and validates input.
export async function trackPublic(name: PublicEvent, anonId: string, props: Record<string, string> = {}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("track_public", { p_name: name, p_anon_id: anonId, p_props: props });
  if (error) console.error("trackPublic failed", name, error.message);
}
