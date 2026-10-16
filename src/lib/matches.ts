import {
  INVESTOR_COLUMNS,
  STARTUP_COLUMNS,
  type InvestorCard,
  type StartupCard,
} from "./catalog";
import type { Session } from "./session";

export type StartupPrivate = {
  founder_name: string;
  founder_bio: string;
  linkedin_url: string;
  contact_email: string;
  deck_url: string;
  detailed_metrics: string;
};
export type InvestorPrivate = { contact_email: string; linkedin_url: string; website_url: string };

export type MatchRow = {
  id: string;
  created_at: string;
  is_demo: boolean;
  startup: StartupCard & { private: StartupPrivate | null };
  investor: InvestorCard & { private: InvestorPrivate | null };
};

const SELECT = `id, created_at, is_demo,
  startup:startups(${STARTUP_COLUMNS}, private:startup_private(*)),
  investor:investor_profiles(${INVESTOR_COLUMNS}, private:investor_private(*))`;

// RLS returns only matches where the user is a party, with private details unlocked.
export async function loadMatches({ supabase }: Session) {
  const { data } = await supabase.from("matches").select(SELECT).order("created_at", { ascending: false });
  return (data ?? []) as unknown as MatchRow[];
}

export async function loadMatch({ supabase }: Session, id: string) {
  const { data } = await supabase.from("matches").select(SELECT).eq("id", id).maybeSingle();
  return data as unknown as MatchRow | null;
}
