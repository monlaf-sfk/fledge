"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";

export type NameState = { error?: string; message?: string };

export async function updateName(_prev: NameState, formData: FormData): Promise<NameState> {
  const fullName = String(formData.get("fullName") ?? "").replace(/\s+/g, " ").trim();
  if (fullName.length < 2 || fullName.length > 80) return { error: "Name must have 2–80 characters." };

  const { supabase, userId } = await requireSession();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: "Could not save. Try again." };

  revalidatePath("/", "layout");
  return { message: "Saved." };
}
