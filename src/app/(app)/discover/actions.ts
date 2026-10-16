"use server";

import { requireOnboarded } from "@/lib/session";
import { track } from "@/lib/track";

export type SwipeAction = "pass" | "save" | "interested";
export type SwipeResult = { matchId?: string; error?: string };

const ACTIONS: SwipeAction[] = ["pass", "save", "interested"];

export async function swipe(targetId: string, action: SwipeAction, score: number): Promise<SwipeResult> {
  if (!ACTIONS.includes(action)) return { error: "Unknown action." };
  const { supabase, userId, role, ownCardId } = await requireOnboarded();

  const column = role === "founder" ? "investor_id" : "startup_id";
  const { error } = await supabase.from("swipes").upsert(
    { actor_id: userId, [column]: targetId, action, updated_at: new Date().toISOString() },
    { onConflict: `actor_id,${column}` },
  );
  if (error) return { error: error.message };

  await track(supabase, userId, "card_action", {
    action,
    target_kind: role === "founder" ? "investor" : "startup",
    target_id: targetId,
    score: Math.max(0, Math.min(100, Math.round(score) || 0)),
  });

  // No revalidatePath here: it would re-render the feed under the open deck and skip cards.
  // App pages are dynamic, so Saved and Matches load fresh data on navigation anyway.
  if (action !== "interested") return {};

  // The trigger creates the match in the same statement when interest is mutual.
  const startupId = role === "founder" ? ownCardId! : targetId;
  const investorId = role === "founder" ? targetId : ownCardId!;
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("startup_id", startupId)
    .eq("investor_id", investorId)
    .maybeSingle();

  return { matchId: match?.id };
}

export async function trackCardView(targetId: string, score: number, position: number) {
  const { supabase, userId, role } = await requireOnboarded();
  await track(supabase, userId, "card_viewed", {
    target_kind: role === "founder" ? "investor" : "startup",
    target_id: targetId,
    score: Math.max(0, Math.min(100, Math.round(score) || 0)),
    position: Math.max(0, Math.round(position) || 0),
  });
}
