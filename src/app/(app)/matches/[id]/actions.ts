"use server";

import { revalidatePath } from "next/cache";
import { requireOnboarded } from "@/lib/session";
import { track } from "@/lib/track";

export async function sendMessage(matchId: string, body: string): Promise<{ error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Message is empty." };
  if (text.length > 2000) return { error: "Message must be at most 2000 characters." };

  const { supabase, userId } = await requireOnboarded();
  // RLS rejects the insert unless the user is a party of this match.
  const { error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: userId, body: text });
  if (error) return { error: "Could not send the message." };

  await track(supabase, userId, "message_sent", { match_id: matchId, length: text.length });
  revalidatePath(`/matches/${matchId}`);
  return {};
}
