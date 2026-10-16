import type { SupabaseClient } from "@supabase/supabase-js";

export type EventName =
  | "signup_completed"
  | "profile_completed"
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
  const { error } = await supabase.from("events").insert({ user_id: userId, name, props });
  if (error) console.error("track failed", name, error.message);
}
