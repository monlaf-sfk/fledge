"use server";

import { redirect } from "next/navigation";
import {
  GEOGRAPHIES,
  INDUSTRIES,
  INVESTOR_TYPES,
  STAGES,
  TRACTION_RANGES,
} from "@/lib/catalog";
import { requireSession } from "@/lib/session";
import { track } from "@/lib/track";

export type OnboardingState = { error?: string };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => Number.parseInt(str(f, k).replace(/[\s,]/g, ""), 10);
const oneOf = <T extends string>(list: readonly T[], v: string): v is T => (list as readonly string[]).includes(v);
const manyOf = <T extends string>(list: readonly T[], f: FormData, k: string) =>
  f.getAll(k).map(String).filter((v): v is T => oneOf(list, v));

function cleanUrl(v: string) {
  if (!v) return "";
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function saveFounder(_prev: OnboardingState, f: FormData): Promise<OnboardingState> {
  const { supabase, userId, role, ownCardId, fullName } = await requireSession();
  if (role !== "founder") return { error: "Only founders can create a startup profile." };

  const card = {
    owner_id: userId,
    name: str(f, "name"),
    pitch: str(f, "pitch"),
    problem: str(f, "problem"),
    industry: str(f, "industry"),
    stage: str(f, "stage"),
    geography: str(f, "geography"),
    traction_range: str(f, "traction_range"),
    funding_target_usd: int(f, "funding_target_usd"),
    team_size: int(f, "team_size"),
    looking_for: manyOf(INVESTOR_TYPES, f, "looking_for"),
    updated_at: new Date().toISOString(),
  };

  if (card.name.length < 2) return { error: "Enter the startup name." };
  if (card.pitch.length < 10 || card.pitch.length > 140) return { error: "One-line pitch must be 10–140 characters." };
  if (card.problem.length > 600) return { error: "Problem description must be at most 600 characters." };
  if (!oneOf(INDUSTRIES, card.industry)) return { error: "Choose an industry." };
  if (!oneOf(STAGES, card.stage)) return { error: "Choose a stage." };
  if (!oneOf(GEOGRAPHIES, card.geography)) return { error: "Choose a geography." };
  if (!oneOf(TRACTION_RANGES, card.traction_range)) return { error: "Choose a traction range." };
  if (!(card.funding_target_usd > 0)) return { error: "Enter the funding target in USD." };
  if (!(card.team_size >= 1 && card.team_size <= 500)) return { error: "Team size must be 1–500." };
  if (!card.looking_for.length) return { error: "Choose at least one investor type you are looking for." };

  const linkedin = cleanUrl(str(f, "linkedin_url"));
  const deck = cleanUrl(str(f, "deck_url"));
  if (linkedin === null || deck === null) return { error: "LinkedIn and deck must be valid links." };

  const { data: saved, error } = await supabase
    .from("startups")
    .upsert(card, { onConflict: "owner_id" })
    .select("id")
    .single();
  if (error || !saved) return { error: error?.message ?? "Could not save the startup." };

  const { error: privErr } = await supabase.from("startup_private").upsert({
    startup_id: saved.id,
    founder_name: fullName,
    founder_bio: str(f, "founder_bio").slice(0, 600),
    linkedin_url: linkedin,
    contact_email: str(f, "contact_email").slice(0, 200),
    deck_url: deck,
    detailed_metrics: str(f, "detailed_metrics").slice(0, 600),
  });
  if (privErr) return { error: privErr.message };

  if (!ownCardId) await track(supabase, userId, "profile_completed", { role });
  redirect(ownCardId ? "/dashboard" : "/discover");
}

export async function saveInvestor(_prev: OnboardingState, f: FormData): Promise<OnboardingState> {
  const { supabase, userId, role, ownCardId } = await requireSession();
  if (role !== "investor") return { error: "Only investors can create an investment profile." };

  const card = {
    owner_id: userId,
    display_name: str(f, "display_name"),
    investor_type: str(f, "investor_type"),
    thesis: str(f, "thesis"),
    industries: manyOf(INDUSTRIES, f, "industries"),
    stages: manyOf(STAGES, f, "stages"),
    geographies: manyOf(GEOGRAPHIES, f, "geographies"),
    ticket_min_usd: int(f, "ticket_min_usd"),
    ticket_max_usd: int(f, "ticket_max_usd"),
    portfolio: str(f, "portfolio"),
    updated_at: new Date().toISOString(),
  };

  if (card.display_name.length < 2) return { error: "Enter your name or fund name." };
  if (!oneOf(INVESTOR_TYPES, card.investor_type)) return { error: "Choose the investor type." };
  if (card.thesis.length < 10 || card.thesis.length > 600) return { error: "Thesis must be 10–600 characters." };
  if (!card.industries.length) return { error: "Choose at least one industry." };
  if (!card.stages.length) return { error: "Choose at least one stage." };
  if (!card.geographies.length) return { error: "Choose at least one geography." };
  if (!(card.ticket_min_usd > 0)) return { error: "Enter the minimum ticket in USD." };
  if (!(card.ticket_max_usd >= card.ticket_min_usd)) return { error: "Maximum ticket must be at least the minimum." };
  if (card.portfolio.length > 400) return { error: "Portfolio must be at most 400 characters." };

  const linkedin = cleanUrl(str(f, "linkedin_url"));
  const website = cleanUrl(str(f, "website_url"));
  if (linkedin === null || website === null) return { error: "LinkedIn and website must be valid links." };

  const { data: saved, error } = await supabase
    .from("investor_profiles")
    .upsert(card, { onConflict: "owner_id" })
    .select("id")
    .single();
  if (error || !saved) return { error: error?.message ?? "Could not save the profile." };

  const { error: privErr } = await supabase.from("investor_private").upsert({
    investor_id: saved.id,
    contact_email: str(f, "contact_email").slice(0, 200),
    linkedin_url: linkedin,
    website_url: website,
  });
  if (privErr) return { error: privErr.message };

  if (!ownCardId) await track(supabase, userId, "profile_completed", { role });
  redirect(ownCardId ? "/dashboard" : "/discover");
}
