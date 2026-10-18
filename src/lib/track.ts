import type { SupabaseClient } from "@supabase/supabase-js";
import { captureServer } from "@/lib/analytics/server";

export type EventName =
  | "signup_completed"
  | "profile_completed"
  | "onboarding_step"
  | "card_viewed"
  | "card_action"
  | "message_sent";

// Fire-and-forget analytics. A failed insert must never break the user action.
export async function track(
  supabase: SupabaseClient,
  userId: string,
  name: EventName,
  props: Record<string, unknown> = {},
) {
  // Person properties ride on every server event, so test-account filtering works even when
  // the browser never sent an identify call (ad blockers, bots, server-only flows).
  const { data: person } = await supabase.from("profiles").select("role, is_test").eq("id", userId).maybeSingle();
  const [{ error }] = await Promise.all([
    supabase.from("events").insert({ user_id: userId, name, props }),
    captureServer(userId, name, {
      ...props,
      ...(person ? { $set: { role: person.role, is_test: person.is_test } } : {}),
    }),
  ]);
  if (error) console.error("track failed", name, error.message);
}
